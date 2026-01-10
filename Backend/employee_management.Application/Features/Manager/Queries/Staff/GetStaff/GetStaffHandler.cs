using MediatR;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Staff.GetStaff
{
    public sealed class GetStaffHandler : IRequestHandler<GetStaffRequest, GetStaffResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IJobRepository _jobRepository;

        public GetStaffHandler(
            IEmployeeRepository employeeRepository,
            IJobRepository jobRepository)
        {
            _employeeRepository = employeeRepository;
            _jobRepository = jobRepository;
        }

        public async Task<GetStaffResponse> Handle(GetStaffRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue 
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var staff = await _employeeRepository.GetStaffWithPerformanceAsync(dateFrom, dateTo, cancellationToken);
            var allJobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);

            var staffDtos = new List<StaffDto>();

            foreach (var employee in staff)
            {
                var employeeJobs = allJobs.Where(j => j.AssigneeId == employee.Id).ToList();
                var activeJobs = employeeJobs.Where(j => j.Status == JobStatus.Assigned || j.Status == JobStatus.InProgress).ToList();
                
                // Get today's performance
                var today = DateTime.Today;
                var utcToday = DateTime.SpecifyKind(today, DateTimeKind.Utc);
                var todayStart = new DateTimeOffset(utcToday, TimeSpan.Zero);
                var todayEnd = todayStart.AddDays(1);
                var todayJobs = employeeJobs.Where(j => j.CreatedDate >= todayStart && j.CreatedDate < todayEnd).ToList();
                
                var todayHandled = todayJobs.Count(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost);
                var todayWon = todayJobs.Count(j => j.Status == JobStatus.ClosedWon);
                var todayLost = todayJobs.Count(j => j.Status == JobStatus.ClosedLost);
                
                var handledJobs = employeeJobs.Where(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost).ToList();
                var wonJobs = handledJobs.Where(j => j.Status == JobStatus.ClosedWon).ToList();
                var conversionRate = handledJobs.Count > 0 ? (double)wonJobs.Count / handledJobs.Count * 100 : 0;

                // Calculate average close time
                var closedJobs = employeeJobs.Where(j => j.ClosedDate.HasValue && j.StartedDate.HasValue).ToList();
                var avgCloseTime = closedJobs.Any() 
                    ? TimeSpan.FromMinutes(closedJobs.Average(j => (j.ClosedDate!.Value - j.StartedDate!.Value).TotalMinutes))
                    : TimeSpan.Zero;

                // Category tags
                var categoryTags = wonJobs
                    .Where(j => !string.IsNullOrEmpty(j.Category))
                    .GroupBy(j => j.Category)
                    .OrderByDescending(g => g.Count())
                    .Take(3)
                    .Select(g => g.Key)
                    .ToList();

                // Get status (simplified - would need Queue entity)
                var status = AvailabilityStatus.Available; // TODO: Get from Queue
                var timeInCurrentStatus = TimeSpan.Zero; // TODO: Calculate from EmployeeStatusHistory

                staffDtos.Add(new StaffDto(
                    employee.Id,
                    employee.Name,
                    status,
                    timeInCurrentStatus,
                    activeJobs.Count,
                    todayHandled,
                    todayWon,
                    todayLost,
                    conversionRate,
                    avgCloseTime,
                    categoryTags
                ));
            }

            return new GetStaffResponse(staffDtos);
        }
    }
}
