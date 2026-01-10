namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetKpis
{
    public sealed record GetKpisResponse(
        int CustomersWaitingNow,
        double AvgWaitTimeMinutes,
        int ReadyStaffCount,
        int ActiveConversations,
        decimal SalesToday,
        double ConversionToday,
        int SlaBreachCount,
        string TopCategoryToday
    );
}
