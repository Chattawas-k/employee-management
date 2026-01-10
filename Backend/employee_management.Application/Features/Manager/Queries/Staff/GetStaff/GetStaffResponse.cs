using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Staff.GetStaff
{
    public sealed record GetStaffResponse(
        List<StaffDto> Staff
    );

    public sealed record StaffDto(
        Guid Id,
        string Name,
        AvailabilityStatus Status,
        TimeSpan TimeInCurrentStatus,
        int ActiveLoad,
        int TodayHandled,
        int TodayWon,
        int TodayLost,
        double ConversionRate,
        TimeSpan AvgCloseTime,
        List<string> CategoryTags
    );
}
