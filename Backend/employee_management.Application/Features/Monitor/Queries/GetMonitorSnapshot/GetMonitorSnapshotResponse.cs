using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Monitor.Queries.GetMonitorSnapshot
{
    public sealed record GetMonitorSnapshotResponse(
        DateTime Date,
        DateTimeOffset GeneratedAt,
        MonitorCounts Counts,
        MonitorStaffItem? NextQueue,
        List<MonitorStaffItem> WaitingList,
        List<MonitorServingItem> ServingNow
    );

    public sealed record MonitorCounts(
        int WaitingTotal,
        int ServingTotal
    );

    public sealed record MonitorStaffItem(
        Guid EmployeeId,
        string EmployeeName,
        int QueuePosition
    );

    public sealed record MonitorServingItem(
        Guid EmployeeId,
        string EmployeeName,
        string? JobNumber,
        QueueStatus QueueStatus,
        AvailabilityStatus AvailabilityStatus
    );
}

