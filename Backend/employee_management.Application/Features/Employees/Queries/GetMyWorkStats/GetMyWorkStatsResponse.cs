namespace employee_management.Application.Features.Employees.Queries.GetMyWorkStats
{
    public sealed record GetMyWorkStatsResponse(
        TaskStatsDto TaskStats,
        SalesStatsDto SalesStats,
        DateTime StartDate,
        DateTime EndDate
    );

    public sealed record TaskStatsDto(
        int Total,
        int Pending,
        int InProgress,
        int CompletedWon,
        int CompletedLost,
        int Cancelled
    );

    public sealed record SalesStatsDto(
        int Total,
        int Success,
        int Pending,
        int Failed,
        decimal ConversionRate
    );
}
