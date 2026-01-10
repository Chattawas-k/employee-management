using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Application.Features.Manager.Queries.Queue.GetTickets
{
    public sealed class GetTicketsHandler : IRequestHandler<GetTicketsRequest, GetTicketsResponse>
    {
        private readonly IJobRepository _jobRepository;

        public GetTicketsHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<GetTicketsResponse> Handle(GetTicketsRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            DateTime? dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : null;
            DateTime? dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : null;

            // Get all jobs with filters
            var jobs = await _jobRepository.GetJobsByStatusAsync(request.Status, dateFrom, dateTo, cancellationToken);

            // Apply additional filters in memory
            if (!string.IsNullOrEmpty(request.Channel))
            {
                jobs = jobs.Where(j => j.Channel == request.Channel).ToList();
            }

            if (!string.IsNullOrEmpty(request.Category))
            {
                jobs = jobs.Where(j => j.Category == request.Category).ToList();
            }

            if (request.AssignedStaffId.HasValue)
            {
                jobs = jobs.Where(j => j.AssigneeId == request.AssignedStaffId.Value).ToList();
            }

            var now = DateTimeOffset.UtcNow;
            var nowDateTime = DateTime.UtcNow;

            // Filter by SLA risk
            if (request.IsSlaAtRisk.HasValue && request.IsSlaAtRisk.Value)
            {
                jobs = jobs.Where(j =>
                    (j.SlaWaitingBreachAt.HasValue && nowDateTime >= j.SlaWaitingBreachAt.Value) ||
                    (j.SlaAssignedBreachAt.HasValue && nowDateTime >= j.SlaAssignedBreachAt.Value)
                ).ToList();
            }

            // Filter by escalated
            if (request.IsEscalated.HasValue)
            {
                jobs = jobs.Where(j => j.IsEscalated == request.IsEscalated.Value).ToList();
            }

            // Calculate total count before pagination
            var totalCount = jobs.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            // Apply pagination
            var paginatedJobs = jobs
                .OrderByDescending(j => j.CreatedDate)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            // Map to DTOs
            var tickets = paginatedJobs.Select(job =>
            {
                var waitTime = now - job.CreatedDate;
                var isSlaAtRisk = (job.SlaWaitingBreachAt.HasValue && nowDateTime >= job.SlaWaitingBreachAt.Value) ||
                                  (job.SlaAssignedBreachAt.HasValue && nowDateTime >= job.SlaAssignedBreachAt.Value);

                return new TicketDto(
                    job.Id,
                    job.JobNumber,
                    job.Customer,
                    job.Channel,
                    job.Category,
                    job.Status,
                    job.Priority,
                    job.AssigneeId,
                    job.Employee?.Name,
                    job.CreatedDate,
                    job.AssignedDate,
                    job.StartedDate,
                    job.ClosedDate,
                    waitTime,
                    isSlaAtRisk,
                    job.IsEscalated
                );
            }).ToList();

            return new GetTicketsResponse(
                tickets,
                totalCount,
                request.PageNumber,
                request.PageSize,
                totalPages
            );
        }
    }
}
