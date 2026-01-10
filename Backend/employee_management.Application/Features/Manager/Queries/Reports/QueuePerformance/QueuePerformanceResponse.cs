namespace employee_management.Application.Features.Manager.Queries.Reports.QueuePerformance
{
    public sealed record QueuePerformanceResponse(
        QueuePerformanceSummary Summary,
        List<QueuePerformanceMetric> Metrics
    );

    public sealed record QueuePerformanceSummary(
        int TotalJobs,
        int WaitingJobs,
        int AssignedJobs,
        int InProgressJobs,
        int ClosedWonJobs,
        int ClosedLostJobs,
        int CancelledJobs,
        double AvgWaitTimeMinutes,
        double AvgAssignedTimeMinutes,
        double AvgProcessingTimeMinutes,
        int SlaBreachCount,
        double SlaComplianceRate
    );

    public sealed record QueuePerformanceMetric(
        DateTime Date,
        int CreatedCount,
        int AssignedCount,
        int ClosedCount,
        double AvgWaitTimeMinutes,
        int SlaBreachCount
    );
}
