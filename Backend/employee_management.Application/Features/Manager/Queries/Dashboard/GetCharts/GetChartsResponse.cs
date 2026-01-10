namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetCharts
{
    public sealed record GetChartsResponse(
        QueueTrendData QueueTrend,
        ConversionFunnelData ConversionFunnel,
        CategoryMixData CategoryMix,
        StaffLeaderboardData StaffLeaderboard
    );

    public sealed record QueueTrendData(
        List<QueueTrendPoint> Points
    );

    public sealed record QueueTrendPoint(
        DateTime Date,
        int Created,
        int Closed
    );

    public sealed record ConversionFunnelData(
        int Waiting,
        int Assigned,
        int InProgress,
        int ClosedWon,
        int ClosedLost
    );

    public sealed record CategoryMixData(
        List<CategoryMixItem> Items
    );

    public sealed record CategoryMixItem(
        string Category,
        decimal Amount,
        int Count
    );

    public sealed record StaffLeaderboardData(
        List<StaffLeaderboardItem> BySales,
        List<StaffLeaderboardItem> ByConversion
    );

    public sealed record StaffLeaderboardItem(
        Guid StaffId,
        string StaffName,
        decimal SalesAmount,
        double ConversionRate,
        int HandledCount
    );
}
