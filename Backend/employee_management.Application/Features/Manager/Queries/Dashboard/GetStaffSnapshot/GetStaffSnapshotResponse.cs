using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetStaffSnapshot
{
    public sealed record GetStaffSnapshotResponse(
        List<StaffSnapshotDto> Staff
    );

    public sealed record StaffSnapshotDto(
        Guid Id,
        string Name,
        AvailabilityStatus Status,
        TimeSpan TimeInCurrentStatus,
        int ActiveLoad,
        int TodayHandled,
        int TodayWon,
        List<string> CategoryTags
    );
}
