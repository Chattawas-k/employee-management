namespace employee_management.Application.Features.Manager.Queries.Reports.CategoryReport
{
    public sealed record CategoryReportResponse(
        List<CategoryReportItem> Categories
    );

    public sealed record CategoryReportItem(
        string Category,
        int TotalJobs,
        int WonCount,
        int LostCount,
        double ConversionRate,
        decimal TotalSales,
        decimal AvgDealValue,
        List<CategoryStaffPerformance> TopPerformers
    );

    public sealed record CategoryStaffPerformance(
        Guid StaffId,
        string StaffName,
        int WonCount,
        decimal SalesAmount
    );
}
