using System.Text.Json;
using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobReportHistoriesRepository;
using employee_management.Application.Repository.JobStatusHistoriesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.SalesReasonsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Commands.EditReport
{
    public sealed class EditReportHandler : IRequestHandler<EditReportRequest, EditReportResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IJobStatusHistoryRepository _jobStatusHistoryRepository;
        private readonly IJobReportHistoryRepository _jobReportHistoryRepository;
        private readonly ISalesReasonRepository _salesReasonRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;
        private readonly ILogger<EditReportHandler> _logger;

        public EditReportHandler(
            IUnitOfWork unitOfWork,
            IJobRepository jobRepository,
            IJobStatusHistoryRepository jobStatusHistoryRepository,
            IJobReportHistoryRepository jobReportHistoryRepository,
            ISalesReasonRepository salesReasonRepository,
            IEmployeeRepository employeeRepository,
            ICurrentUserService currentUserService,
            IMapper mapper,
            ILogger<EditReportHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _jobStatusHistoryRepository = jobStatusHistoryRepository;
            _jobReportHistoryRepository = jobReportHistoryRepository;
            _salesReasonRepository = salesReasonRepository;
            _employeeRepository = employeeRepository;
            _currentUserService = currentUserService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<EditReportResponse> Handle(EditReportRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var job = await _jobRepository.Get(request.Id, cancellationToken);
                if (job == null)
                {
                    throw new NoDataFoundException($"Job with Id {request.Id} not found.");
                }

                // Permission: only the assignee may edit their own report, unless this is an admin override.
                var isAdminOverride = request.IsAdminOverride &&
                    _currentUserService.EmployeeId.HasValue &&
                    _currentUserService.EmployeeId.Value != job.AssigneeId;

                if (!isAdminOverride &&
                    (!_currentUserService.EmployeeId.HasValue ||
                     _currentUserService.EmployeeId.Value != job.AssigneeId))
                {
                    throw new ForbiddenException("You are not allowed to edit this report. Only the employee who recorded it can edit.");
                }

                // Snapshot the current (pre-edit) state before mutating anything.
                var beforeSnapshot = BuildSnapshot(job);

                // Build the new report from the request.
                var report = _mapper.Map<JobReport>(request.Report);

                // Materialize reason labels from ids (validated against master data by sales status).
                await MaterializeReasonsAsync(request.Report, report, cancellationToken);

                // Preserve/refresh admin-closed info when editing under an admin override.
                if (isAdminOverride && _currentUserService.EmployeeId.HasValue)
                {
                    report.ClosedByAdminId = _currentUserService.EmployeeId.Value;
                    var adminEmployee = await _employeeRepository.Get(_currentUserService.EmployeeId.Value, cancellationToken);
                    report.ClosedByAdminName = adminEmployee?.Name ?? string.Empty;
                }
                else if (job.Report != null)
                {
                    // Keep any existing admin-closed attribution.
                    report.ClosedByAdminId = job.Report.ClosedByAdminId;
                    report.ClosedByAdminName = job.Report.ClosedByAdminName;
                }

                job.Report = report;

                // Map sales status -> Job.Status. "pending" keeps the current job status
                // (there is no dedicated pending JobStatus and the queue already rotated at close time).
                var previousStatus = job.Status;
                var mappedStatus = MapSalesStatusToJobStatus(request.Report.SalesStatus);
                if (mappedStatus != job.Status)
                {
                    job.Status = mappedStatus;

                    var statusLogs = job.StatusLogs;
                    statusLogs.Add(new StatusLog
                    {
                        Status = mappedStatus.ToString(),
                        Timestamp = DateTimeOffset.UtcNow
                    });
                    job.StatusLogs = statusLogs;

                    _jobStatusHistoryRepository.Create(new JobStatusHistory
                    {
                        JobId = job.Id,
                        PreviousStatus = previousStatus,
                        NewStatus = mappedStatus,
                        ChangeSource = isAdminOverride ? JobChangeSource.AdminOverride : JobChangeSource.Manual,
                        ChangedByEmployeeId = _currentUserService.EmployeeId,
                        ChangedDate = DateTimeOffset.UtcNow,
                        Notes = "Report edited"
                    });
                }

                // NOTE: intentionally NOT re-running the queue/availability cascade here.
                // Editing a saved report is a retroactive correction; the customer was already
                // served and the queue rotated at the original close time.

                var afterSnapshot = BuildSnapshot(job);
                var changedFields = DiffSnapshots(beforeSnapshot, afterSnapshot);

                // Resolve editor identity for the history rows.
                var editorEmployeeId = _currentUserService.EmployeeId;
                string? editorName = null;
                if (editorEmployeeId.HasValue)
                {
                    var editor = await _employeeRepository.Get(editorEmployeeId.Value, cancellationToken);
                    editorName = editor?.Name;
                }

                // Lazily capture the original as version 1 the first time a report is edited.
                var hasHistory = await _jobReportHistoryRepository.AnyForJobAsync(job.Id, cancellationToken);
                if (!hasHistory)
                {
                    var assignee = await _employeeRepository.Get(job.AssigneeId, cancellationToken);
                    _jobReportHistoryRepository.Create(new JobReportHistory
                    {
                        JobId = job.Id,
                        SnapshotJson = JsonSerializer.Serialize(beforeSnapshot),
                        ChangedFieldsJson = "[]",
                        EditedByEmployeeId = job.AssigneeId == Guid.Empty ? null : job.AssigneeId,
                        EditedByName = assignee?.Name ?? job.Report?.ClosedByAdminName,
                        EditedDate = job.ClosedDate.HasValue
                            ? new DateTimeOffset(DateTime.SpecifyKind(job.ClosedDate.Value, DateTimeKind.Utc))
                            : job.CreatedDate,
                        IsOriginal = true
                    });
                }

                // Append the new version.
                _jobReportHistoryRepository.Create(new JobReportHistory
                {
                    JobId = job.Id,
                    SnapshotJson = JsonSerializer.Serialize(afterSnapshot),
                    ChangedFieldsJson = JsonSerializer.Serialize(changedFields),
                    EditedByEmployeeId = editorEmployeeId,
                    EditedByName = editorName,
                    EditedDate = DateTimeOffset.UtcNow,
                    EditNote = request.EditNote,
                    IsOriginal = false
                });

                _jobRepository.Update(job);
                await _unitOfWork.Save(cancellationToken);

                return new EditReportResponse(
                    job.Id,
                    job.JobNumber,
                    job.JobRunningCode,
                    job.Status,
                    new EditReportResultDto(
                        report.CustomerName,
                        report.CustomerContact,
                        report.SalesStatus,
                        report.Reasons,
                        report.ProductCategory,
                        report.Description,
                        report.SaleValue,
                        report.SaleDate,
                        report.ClosedByAdminName
                    ),
                    changedFields
                );
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (ForbiddenException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing report for job with Id: {JobId}", request.Id);
                throw;
            }
        }

        private async Task MaterializeReasonsAsync(EditReportDto dto, JobReport report, CancellationToken cancellationToken)
        {
            report.Reasons = new List<string>();

            if (dto.ReasonIds == null || dto.ReasonIds.Count == 0)
            {
                report.ReasonIds = new List<Guid>();
                return;
            }

            var salesStatus = (dto.SalesStatus ?? string.Empty).Trim().ToLowerInvariant();
            var expectedType = salesStatus switch
            {
                "pending" => SalesReasonType.PendingDecision,
                "failed" => SalesReasonType.FailedClose,
                _ => (SalesReasonType?)null
            };

            if (!expectedType.HasValue)
            {
                // Success has no reasons.
                report.ReasonIds = new List<Guid>();
                return;
            }

            var ids = dto.ReasonIds.Distinct().ToList();
            var reasons = await _salesReasonRepository.GetByIdsAsync(ids, cancellationToken);
            if (reasons.Count != ids.Count)
            {
                throw new InvalidOperationException("Some reasonIds were not found.");
            }

            if (reasons.Any(r => r.Type != expectedType.Value))
            {
                throw new InvalidOperationException("Some reasonIds do not match the required reason type for this sales status.");
            }

            report.ReasonIds = ids;
            report.Reasons = reasons
                .OrderBy(r => r.SortOrder)
                .ThenBy(r => r.Label)
                .Select(r => r.Label)
                .ToList();
        }

        private static JobStatus MapSalesStatusToJobStatus(string? salesStatus)
        {
            // Mirror the normal completion flow (my-tasks): success => ClosedWon, everything
            // else (failed / pending) => ClosedLost. This keeps a report's sales status and the
            // job status in agreement across the sales list and the dashboard metrics.
            return (salesStatus ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "success" => JobStatus.ClosedWon,
                _ => JobStatus.ClosedLost
            };
        }

        private static JobReportSnapshot BuildSnapshot(Job job)
        {
            var report = job.Report;
            return new JobReportSnapshot
            {
                CustomerName = report?.CustomerName ?? string.Empty,
                CustomerContact = report?.CustomerContact ?? string.Empty,
                SalesStatus = report?.SalesStatus ?? string.Empty,
                JobStatus = job.Status.ToString(),
                Reasons = report?.Reasons != null ? new List<string>(report.Reasons) : new List<string>(),
                ProductCategory = report?.ProductCategory ?? string.Empty,
                Description = report?.Description ?? string.Empty,
                SaleValue = report?.SaleValue,
                SaleDate = report?.SaleDate
            };
        }

        private static List<string> DiffSnapshots(JobReportSnapshot before, JobReportSnapshot after)
        {
            var changed = new List<string>();

            if (before.CustomerName != after.CustomerName) changed.Add("customerName");
            if (before.CustomerContact != after.CustomerContact) changed.Add("customerContact");
            if (before.SalesStatus != after.SalesStatus) changed.Add("salesStatus");
            if (before.JobStatus != after.JobStatus) changed.Add("jobStatus");
            if (!before.Reasons.SequenceEqual(after.Reasons)) changed.Add("reasons");
            if (before.ProductCategory != after.ProductCategory) changed.Add("productCategory");
            if (before.Description != after.Description) changed.Add("description");
            if (before.SaleValue != after.SaleValue) changed.Add("saleValue");
            if (before.SaleDate != after.SaleDate) changed.Add("saleDate");

            return changed;
        }
    }
}
