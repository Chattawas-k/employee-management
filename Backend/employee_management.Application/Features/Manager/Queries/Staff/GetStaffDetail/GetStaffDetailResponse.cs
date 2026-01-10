using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Staff.GetStaffDetail
{
    public sealed record GetStaffDetailResponse(
        Guid Id,
        string Name,
        List<StatusTimelineItem> StatusTimeline,
        List<ActiveTicketDto> ActiveTickets,
        TodayPerformanceDto TodayPerformance,
        List<CategoryPerformanceDto> CategoryPerformance
    );

    public sealed record StatusTimelineItem(
        AvailabilityStatus Status,
        DateTimeOffset Timestamp,
        string? Reason
    );

    public sealed record ActiveTicketDto(
        Guid JobId,
        string JobNumber,
        string Customer,
        JobStatus Status,
        bool IsSlaAtRisk
    );

    public sealed record TodayPerformanceDto(
        int Handled,
        int Won,
        int Lost,
        double ConversionRate,
        decimal SalesAmount
    );

    public sealed record CategoryPerformanceDto(
        string Category,
        int WonCount,
        decimal SalesAmount
    );
}
