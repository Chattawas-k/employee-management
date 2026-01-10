namespace employee_management.Application.Features.Manager.Queries.Reports.StaffPerformance
{
    public sealed record StaffPerformanceResponse(
        List<StaffPerformanceDto> StaffPerformances
    );

    public sealed record StaffPerformanceDto(
        Guid StaffId,
        string StaffName,
        int TotalHandled,
        int WonCount,
        int LostCount,
        double ConversionRate,
        decimal TotalSales,
        decimal AvgDealValue,
        double AvgCloseTimeMinutes,
        int ActiveLoad,
        Dictionary<string, int> CategoryBreakdown
    );
}
