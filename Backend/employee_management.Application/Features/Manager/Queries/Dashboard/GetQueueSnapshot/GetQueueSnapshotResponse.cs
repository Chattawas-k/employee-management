using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetQueueSnapshot
{
    public sealed record GetQueueSnapshotResponse(
        List<QueueSnapshotTicketDto> Tickets
    );

    public sealed record QueueSnapshotTicketDto(
        Guid Id,
        string JobNumber,
        string? JobRunningCode,
        string Customer,
        string Channel,
        TimeSpan WaitTime,
        JobPriority Priority,
        JobStatus Status,
        string? AssignedStaffName,
        bool IsSlaAtRisk
    );
}
