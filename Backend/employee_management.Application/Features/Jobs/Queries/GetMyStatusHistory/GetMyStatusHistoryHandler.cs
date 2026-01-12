using MediatR;
using employee_management.Application.Repository.JobStatusHistoriesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.GetMyStatusHistory
{
    public sealed class GetMyStatusHistoryHandler : IRequestHandler<GetMyStatusHistoryRequest, GetMyStatusHistoryResponse>
    {
        private readonly IJobStatusHistoryRepository _jobStatusHistoryRepository;
        private readonly IJobRepository _jobRepository;
        private readonly ILogger<GetMyStatusHistoryHandler> _logger;

        public GetMyStatusHistoryHandler(
            IJobStatusHistoryRepository jobStatusHistoryRepository,
            IJobRepository jobRepository,
            ILogger<GetMyStatusHistoryHandler> logger)
        {
            _jobStatusHistoryRepository = jobStatusHistoryRepository;
            _jobRepository = jobRepository;
            _logger = logger;
        }

        public async Task<GetMyStatusHistoryResponse> Handle(GetMyStatusHistoryRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var histories = await _jobStatusHistoryRepository.GetMyJobStatusHistoryAsync(
                    request.EmployeeId,
                    request.StartDate,
                    request.EndDate,
                    request.ChangeSource,
                    request.JobId,
                    request.Skip,
                    request.Take,
                    cancellationToken);

                var dtos = histories.Select(h => new JobStatusHistoryDto(
                        h.Id,
                        h.JobId,
                        h.Job?.JobNumber,
                        h.Job?.Title,
                        h.Job?.Customer,
                        h.PreviousStatus,
                        h.NewStatus,
                        h.ChangeSource,
                        h.ChangedByEmployeeId,
                        h.ChangedByEmployee?.Name,
                        h.ChangedDate,
                        h.Notes,
                        h.PreviousAssigneeId,
                        h.NewAssigneeId
                    ))
                    .ToList();

                // Backward compatibility:
                // If no structured history exists yet (e.g., jobs created/updated before this feature),
                // fall back to Job.StatusLogs (JSON) and synthesize a history list.
                if (dtos.Count == 0)
                {
                    dtos = await BuildFallbackFromStatusLogsAsync(request, cancellationToken);
                }

                return new GetMyStatusHistoryResponse(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving job status history for employee {EmployeeId}", request.EmployeeId);
                throw;
            }
        }

        private async Task<List<JobStatusHistoryDto>> BuildFallbackFromStatusLogsAsync(
            GetMyStatusHistoryRequest request,
            CancellationToken cancellationToken)
        {
            var jobs = await _jobRepository.GetMyTasksAsync(request.EmployeeId, cancellationToken);

            var all = new List<JobStatusHistoryDto>();

            foreach (var job in jobs)
            {
                var logs = (job.StatusLogs ?? new List<StatusLog>())
                    .OrderBy(l => l.Timestamp)
                    .ToList();

                JobStatus? previous = null;

                foreach (var log in logs)
                {
                    var (newStatus, notes, source) = ParseLegacyStatusLog(log.Status);

                    var dto = new JobStatusHistoryDto(
                        Id: Guid.NewGuid(),
                        JobId: job.Id,
                        JobNumber: job.JobNumber,
                        Title: job.Title,
                        Customer: job.Customer,
                        PreviousStatus: previous,
                        NewStatus: newStatus,
                        ChangeSource: source,
                        ChangedByEmployeeId: null,
                        ChangedByEmployeeName: null,
                        ChangedDate: log.Timestamp,
                        Notes: notes,
                        PreviousAssigneeId: null,
                        NewAssigneeId: job.AssigneeId
                    );

                    all.Add(dto);
                    previous = newStatus;
                }
            }

            // Apply filters similar to the structured query.
            if (request.JobId.HasValue && request.JobId.Value != Guid.Empty)
            {
                all = all.Where(x => x.JobId == request.JobId.Value).ToList();
            }

            if (request.StartDate.HasValue)
            {
                var start = DateTime.SpecifyKind(request.StartDate.Value, DateTimeKind.Utc);
                all = all.Where(x => x.ChangedDate >= start).ToList();
            }

            if (request.EndDate.HasValue)
            {
                var end = DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc);
                all = all.Where(x => x.ChangedDate <= end).ToList();
            }

            if (request.ChangeSource.HasValue)
            {
                all = all.Where(x => x.ChangeSource == request.ChangeSource.Value).ToList();
            }

            return all
                .OrderByDescending(x => x.ChangedDate)
                .Skip(Math.Max(0, request.Skip))
                .Take(request.Take <= 0 ? 50 : Math.Min(request.Take, 200))
                .ToList();
        }

        private static (JobStatus newStatus, string? notes, JobChangeSource source) ParseLegacyStatusLog(string raw)
        {
            raw ??= string.Empty;
            var s = raw.Trim();

            // Heuristics for assignment-related logs (legacy free-text)
            var lower = s.ToLowerInvariant();
            if (lower.Contains("force assigned") || lower.Contains("transferred") || lower.Contains("auto assigned"))
            {
                return (JobStatus.Assigned, s, JobChangeSource.Assigned);
            }

            // Cancelled reason was stored as "Cancelled: <reason>"
            if (lower.StartsWith("cancelled:"))
            {
                var reason = s.Substring("Cancelled:".Length).Trim();
                return (JobStatus.Cancelled, string.IsNullOrWhiteSpace(reason) ? null : reason, JobChangeSource.Manual);
            }

            if (Enum.TryParse<JobStatus>(s, ignoreCase: true, out var parsed))
            {
                // Legacy logs didn't store source; default to Manual for transitions,
                // but treat the initial Pending as Auto.
                var source = parsed == JobStatus.Pending ? JobChangeSource.Auto : JobChangeSource.Manual;
                return (parsed, null, source);
            }

            // Unknown text: keep status as Assigned-ish but preserve the raw text as notes.
            return (JobStatus.Assigned, s, JobChangeSource.Assigned);
        }
    }
}

