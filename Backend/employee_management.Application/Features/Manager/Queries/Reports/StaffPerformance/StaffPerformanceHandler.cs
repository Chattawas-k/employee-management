using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Reports.StaffPerformance
{
    public sealed class StaffPerformanceHandler : IRequestHandler<StaffPerformanceRequest, StaffPerformanceResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IEmployeeRepository _employeeRepository;

        public StaffPerformanceHandler(
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository)
        {
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
        }

        public async Task<StaffPerformanceResponse> Handle(StaffPerformanceRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(-30), DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var jobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);
            var staffList = await _employeeRepository.GetStaffWithPerformanceAsync(dateFrom, dateTo, cancellationToken);

            var performances = new List<StaffPerformanceDto>();

            foreach (var staff in staffList)
            {
                var staffJobs = jobs.Where(j => j.AssigneeId == staff.Id).ToList();
                var closedJobs = staffJobs.Where(j => 
                    j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost).ToList();
                var wonJobs = staffJobs.Where(j => j.Status == JobStatus.ClosedWon).ToList();
                var lostJobs = staffJobs.Where(j => j.Status == JobStatus.ClosedLost).ToList();

                var totalHandled = closedJobs.Count;
                var wonCount = wonJobs.Count;
                var lostCount = lostJobs.Count;
                var conversionRate = totalHandled > 0 ? (double)wonCount / totalHandled * 100 : 0;

                // Calculate sales
                var totalSales = wonJobs
                    .Where(j => j.Report != null && 
                        j.Report.SalesStatus.ToLower() == "success" &&
                        decimal.TryParse(j.Report.Description, out var amount))
                    .Sum(j => decimal.Parse(j.Report!.Description!));

                var avgDealValue = wonCount > 0 ? totalSales / wonCount : 0;

                // Calculate average close time
                var jobsWithCloseTime = closedJobs
                    .Where(j => j.StartedDate.HasValue && j.ClosedDate.HasValue).ToList();
                var avgCloseTime = jobsWithCloseTime.Any()
                    ? jobsWithCloseTime.Average(j => (j.ClosedDate!.Value - j.StartedDate!.Value).TotalMinutes)
                    : 0;

                // Active load (in-progress jobs)
                var activeLoad = staffJobs.Count(j => j.Status == JobStatus.InProgress);

                // Category breakdown
                var categoryBreakdown = wonJobs
                    .Where(j => !string.IsNullOrEmpty(j.Category))
                    .GroupBy(j => j.Category)
                    .ToDictionary(g => g.Key, g => g.Count());

                performances.Add(new StaffPerformanceDto(
                    staff.Id,
                    staff.Name,
                    totalHandled,
                    wonCount,
                    lostCount,
                    conversionRate,
                    totalSales,
                    avgDealValue,
                    avgCloseTime,
                    activeLoad,
                    categoryBreakdown
                ));
            }

            return new StaffPerformanceResponse(performances.OrderByDescending(p => p.TotalSales).ToList());
        }
    }
}
