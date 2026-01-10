using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Reports.QueuePerformance
{
    public sealed class QueuePerformanceHandler : IRequestHandler<QueuePerformanceRequest, QueuePerformanceResponse>
    {
        private readonly IJobRepository _jobRepository;

        public QueuePerformanceHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<QueuePerformanceResponse> Handle(QueuePerformanceRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(-30), DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var jobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);
            var slaBreachJobs = await _jobRepository.GetJobsWithSlaBreachAsync(cancellationToken);

            // Calculate summary
            var totalJobs = jobs.Count;
            var waitingJobs = jobs.Count(j => j.Status == JobStatus.Pending);
            var assignedJobs = jobs.Count(j => j.Status == JobStatus.Assigned);
            var inProgressJobs = jobs.Count(j => j.Status == JobStatus.InProgress);
            var closedWonJobs = jobs.Count(j => j.Status == JobStatus.ClosedWon);
            var closedLostJobs = jobs.Count(j => j.Status == JobStatus.ClosedLost);
            var cancelledJobs = jobs.Count(j => j.Status == JobStatus.Cancelled);

            // Calculate average wait times
            var waitingJobList = jobs.Where(j => j.Status == JobStatus.Pending).ToList();
            var avgWaitTime = waitingJobList.Any() 
                ? waitingJobList.Average(j => (DateTimeOffset.UtcNow - j.CreatedDate).TotalMinutes)
                : 0;

            var assignedJobList = jobs.Where(j => j.Status == JobStatus.Assigned && j.AssignedDate.HasValue).ToList();
            var avgAssignedTime = assignedJobList.Any()
                ? assignedJobList.Average(j => (DateTime.UtcNow - j.AssignedDate!.Value).TotalMinutes)
                : 0;

            var closedJobList = jobs.Where(j => 
                (j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost) &&
                j.StartedDate.HasValue && j.ClosedDate.HasValue).ToList();
            var avgProcessingTime = closedJobList.Any()
                ? closedJobList.Average(j => (j.ClosedDate!.Value - j.StartedDate!.Value).TotalMinutes)
                : 0;

            var slaBreachCount = slaBreachJobs.Count;
            var slaComplianceRate = totalJobs > 0 ? ((double)(totalJobs - slaBreachCount) / totalJobs) * 100 : 100;

            var summary = new QueuePerformanceSummary(
                totalJobs,
                waitingJobs,
                assignedJobs,
                inProgressJobs,
                closedWonJobs,
                closedLostJobs,
                cancelledJobs,
                avgWaitTime,
                avgAssignedTime,
                avgProcessingTime,
                slaBreachCount,
                slaComplianceRate
            );

            // Calculate daily metrics
            var metrics = new List<QueuePerformanceMetric>();
            var currentDate = dateFrom.Date;
            var endDate = dateTo.Date;

            while (currentDate <= endDate)
            {
                var utcCurrentDate = DateTime.SpecifyKind(currentDate, DateTimeKind.Utc);
                var utcNextDate = DateTime.SpecifyKind(currentDate.AddDays(1), DateTimeKind.Utc);
                var dayStart = new DateTimeOffset(utcCurrentDate, TimeSpan.Zero);
                var dayEnd = new DateTimeOffset(utcNextDate, TimeSpan.Zero);

                var dayJobs = jobs.Where(j => 
                    j.CreatedDate >= dayStart && j.CreatedDate < dayEnd).ToList();

                var createdCount = dayJobs.Count;
                var assignedCount = dayJobs.Count(j => j.AssignedDate.HasValue && 
                    j.AssignedDate.Value.Date == currentDate);
                var closedCount = dayJobs.Count(j => j.ClosedDate.HasValue && 
                    j.ClosedDate.Value.Date == currentDate);

                var dayWaitingJobs = dayJobs.Where(j => j.Status == JobStatus.Pending).ToList();
                var dayAvgWaitTime = dayWaitingJobs.Any()
                    ? dayWaitingJobs.Average(j => (dayEnd - j.CreatedDate).TotalMinutes)
                    : 0;

                var daySlaBreachCount = dayJobs.Count(j =>
                    (j.SlaWaitingBreachAt.HasValue && j.SlaWaitingBreachAt.Value.Date == currentDate) ||
                    (j.SlaAssignedBreachAt.HasValue && j.SlaAssignedBreachAt.Value.Date == currentDate));

                metrics.Add(new QueuePerformanceMetric(
                    currentDate,
                    createdCount,
                    assignedCount,
                    closedCount,
                    dayAvgWaitTime,
                    daySlaBreachCount
                ));

                currentDate = currentDate.AddDays(1);
            }

            return new QueuePerformanceResponse(summary, metrics);
        }
    }
}
