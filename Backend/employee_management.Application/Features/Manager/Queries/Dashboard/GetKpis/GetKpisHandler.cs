using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetKpis
{
    public sealed class GetKpisHandler : IRequestHandler<GetKpisRequest, GetKpisResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IEmployeeRepository _employeeRepository;

        public GetKpisHandler(
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository)
        {
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
        }

        public async Task<GetKpisResponse> Handle(GetKpisRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var today = DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : today;
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            // 1. Customers Waiting Now
            var waitingJobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.Pending, null, null, cancellationToken);
            var customersWaitingNow = waitingJobs.Count;

            // 2. Avg Wait Time (minutes)
            var avgWaitTime = await _jobRepository.GetAverageWaitTimeAsync(cancellationToken);

            // 3. Ready Staff Count
            var readyStaffCount = await _employeeRepository.GetReadyStaffCountAsync(cancellationToken);

            // 4. Active Conversations (ASSIGNED + IN_PROGRESS)
            var assignedJobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.Assigned, null, null, cancellationToken);
            var inProgressJobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.InProgress, null, null, cancellationToken);
            var activeConversations = assignedJobs.Count + inProgressJobs.Count;

            // 5. Sales Today (sum amount of CLOSED_WON with Report.SalesStatus = "success")
            var closedWonJobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.ClosedWon, dateFrom, dateTo, cancellationToken);
            var salesToday = closedWonJobs
                .Where(j => j.Report != null && j.Report.SalesStatus.ToLower() == "success")
                .Sum(j => j.Report?.Description != null && decimal.TryParse(j.Report.Description, out var amount) ? amount : 0m);

            // 6. Conversion Today (CLOSED_WON / (CLOSED_WON + CLOSED_LOST))
            var closedLostJobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.ClosedLost, dateFrom, dateTo, cancellationToken);
            var wonCount = closedWonJobs.Count;
            var lostCount = closedLostJobs.Count;
            var handledCount = wonCount + lostCount;
            var conversionToday = handledCount > 0 ? (double)wonCount / handledCount * 100 : 0;

            // 7. SLA Breach Count
            var slaBreachJobs = await _jobRepository.GetJobsWithSlaBreachAsync(cancellationToken);
            var slaBreachCount = slaBreachJobs.Count;

            // 8. Top Category Today
            var salesByCategory = await _jobRepository.GetSalesByCategoryAsync(dateFrom, dateTo, cancellationToken);
            var topCategoryToday = salesByCategory.OrderByDescending(kvp => kvp.Value).FirstOrDefault().Key ?? "N/A";

            return new GetKpisResponse(
                customersWaitingNow,
                avgWaitTime,
                readyStaffCount,
                activeConversations,
                salesToday,
                conversionToday,
                slaBreachCount,
                topCategoryToday
            );
        }
    }
}
