using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Staff.GetStaffDetail
{
    public sealed class GetStaffDetailHandler : IRequestHandler<GetStaffDetailRequest, GetStaffDetailResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IJobRepository _jobRepository;

        public GetStaffDetailHandler(
            IEmployeeRepository employeeRepository,
            IJobRepository jobRepository)
        {
            _employeeRepository = employeeRepository;
            _jobRepository = jobRepository;
        }

        public async Task<GetStaffDetailResponse> Handle(GetStaffDetailRequest request, CancellationToken cancellationToken)
        {
            var staff = await _employeeRepository.Get(request.StaffId, cancellationToken);
            if (staff == null)
            {
                throw new NoDataFoundException($"Employee with Id {request.StaffId} not found.");
            }

            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var allJobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);
            var employeeJobs = allJobs.Where(j => j.AssigneeId == request.StaffId).ToList();

            // Status Timeline (simplified - would need EmployeeStatusHistory)
            var statusTimeline = new List<StatusTimelineItem>
            {
                new StatusTimelineItem(AvailabilityStatus.Available, DateTimeOffset.UtcNow, null)
            };

            // Active Tickets
            var activeTickets = employeeJobs
                .Where(j => j.Status == JobStatus.Assigned || j.Status == JobStatus.InProgress)
                .Select(j => new ActiveTicketDto(
                    j.Id,
                    j.JobNumber,
                    j.JobRunningCode,
                    j.Customer,
                    j.Status,
                    j.SlaAssignedBreachAt.HasValue && DateTime.UtcNow >= j.SlaAssignedBreachAt.Value
                ))
                .ToList();

            // Today Performance
            var today = DateTime.Today;
            var utcToday = DateTime.SpecifyKind(today, DateTimeKind.Utc);
            var todayStart = new DateTimeOffset(utcToday, TimeSpan.Zero);
            var todayEnd = todayStart.AddDays(1);
            var todayJobs = employeeJobs.Where(j => j.CreatedDate >= todayStart && j.CreatedDate < todayEnd).ToList();
            var todayHandled = todayJobs.Count(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost);
            var todayWon = todayJobs.Count(j => j.Status == JobStatus.ClosedWon);
            var todayLost = todayJobs.Count(j => j.Status == JobStatus.ClosedLost);
            var todayConversionRate = todayHandled > 0 ? (double)todayWon / todayHandled * 100 : 0;
            var todaySalesAmount = todayJobs
                .Where(j => j.Status == JobStatus.ClosedWon && j.Report != null && j.Report.SalesStatus.ToLower() == "success")
                .Sum(j => j.Report?.Description != null && decimal.TryParse(j.Report.Description, out var amount) ? amount : 0m);

            var todayPerformance = new TodayPerformanceDto(
                todayHandled,
                todayWon,
                todayLost,
                todayConversionRate,
                todaySalesAmount
            );

            // Category Performance
            var wonJobs = employeeJobs.Where(j => j.Status == JobStatus.ClosedWon && !string.IsNullOrEmpty(j.Category)).ToList();
            var categoryPerformance = wonJobs
                .GroupBy(j => j.Category)
                .Select(g => new CategoryPerformanceDto(
                    g.Key,
                    g.Count(),
                    g.Where(j => j.Report != null && j.Report.SalesStatus.ToLower() == "success")
                        .Sum(j => j.Report?.Description != null && decimal.TryParse(j.Report.Description, out var amount) ? amount : 0m)
                ))
                .OrderByDescending(c => c.SalesAmount)
                .ToList();

            return new GetStaffDetailResponse(
                staff.Id,
                staff.Name,
                statusTimeline,
                activeTickets,
                todayPerformance,
                categoryPerformance
            );
        }
    }
}
