namespace employee_management.Application.Features.Manager.Queries.Deals.GetDealsSummary
{
    public sealed record GetDealsSummaryResponse(
        decimal TotalSales,
        decimal AvgDeal,
        double ConversionRate,
        string TopStaff,
        string TopCategory
    );
}
