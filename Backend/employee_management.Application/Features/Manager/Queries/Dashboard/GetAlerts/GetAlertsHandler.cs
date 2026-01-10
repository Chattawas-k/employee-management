using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.QueueRulesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetAlerts
{
    public sealed class GetAlertsHandler : IRequestHandler<GetAlertsRequest, GetAlertsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IQueueRuleRepository _queueRuleRepository;

        public GetAlertsHandler(
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository,
            IQueueRuleRepository queueRuleRepository)
        {
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
            _queueRuleRepository = queueRuleRepository;
        }

        public async Task<GetAlertsResponse> Handle(GetAlertsRequest request, CancellationToken cancellationToken)
        {
            var alerts = new List<AlertDto>();
            var nowDateTime = DateTime.UtcNow;
            var queueRule = await _queueRuleRepository.GetActiveRuleAsync(cancellationToken);

            if (queueRule == null)
            {
                return new GetAlertsResponse(alerts);
            }

            // 1. WAITING over SLA
            var waitingJobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.Pending, null, null, cancellationToken);
            var waitingOverSla = waitingJobs.Where(j => j.SlaWaitingBreachAt.HasValue && nowDateTime >= j.SlaWaitingBreachAt.Value).ToList();
            foreach (var job in waitingOverSla)
            {
                alerts.Add(new AlertDto(
                    Guid.NewGuid().ToString(),
                    AlertSeverity.High,
                    "WAITING_OVER_SLA",
                    $"Job {job.JobNumber} has been waiting over SLA threshold",
                    DateTimeOffset.UtcNow
                ));
            }

            // 2. ASSIGNED over SLA without activity
            var assignedJobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.Assigned, null, null, cancellationToken);
            var assignedOverSla = assignedJobs.Where(j => j.SlaAssignedBreachAt.HasValue && nowDateTime >= j.SlaAssignedBreachAt.Value).ToList();
            foreach (var job in assignedOverSla)
            {
                alerts.Add(new AlertDto(
                    Guid.NewGuid().ToString(),
                    AlertSeverity.High,
                    "ASSIGNED_OVER_SLA",
                    $"Job {job.JobNumber} assigned to {job.Employee?.Name} is over SLA without activity",
                    DateTimeOffset.UtcNow
                ));
            }

            // 3. Ready staff below threshold
            var readyStaffCount = await _employeeRepository.GetReadyStaffCountAsync(cancellationToken);
            if (readyStaffCount < queueRule.ReadyStaffThreshold)
            {
                alerts.Add(new AlertDto(
                    Guid.NewGuid().ToString(),
                    AlertSeverity.Medium,
                    "READY_STAFF_BELOW_THRESHOLD",
                    $"Only {readyStaffCount} staff members are ready (threshold: {queueRule.ReadyStaffThreshold})",
                    DateTimeOffset.UtcNow
                ));
            }

            // 4. Staff BUSY too long (would need EmployeeStatusHistory to track)
            // Simplified: check if any staff has been busy for too long
            // TODO: Implement with EmployeeStatusHistory

            // 5. Spike detection: Waiting count increased > 20% in last 5 minutes
            var currentWaiting = waitingJobs.Count;
            var fiveMinutesAgo = DateTimeOffset.UtcNow.AddMinutes(-5);
            var oldWaitingJobs = waitingJobs.Where(j => j.CreatedDate < fiveMinutesAgo).Count();
            if (oldWaitingJobs > 0)
            {
                var increasePercent = ((double)(currentWaiting - oldWaitingJobs) / oldWaitingJobs) * 100;
                if (increasePercent > 20)
                {
                    alerts.Add(new AlertDto(
                        Guid.NewGuid().ToString(),
                        AlertSeverity.Medium,
                        "WAITING_SPIKE",
                        $"Waiting queue increased by {increasePercent:F1}% in the last 5 minutes",
                        DateTimeOffset.UtcNow
                    ));
                }
            }

            return new GetAlertsResponse(alerts.OrderByDescending(a => a.Severity).ToList());
        }
    }
}
