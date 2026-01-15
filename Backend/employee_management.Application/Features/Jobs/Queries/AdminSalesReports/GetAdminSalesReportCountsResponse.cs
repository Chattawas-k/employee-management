namespace employee_management.Application.Features.Jobs.Queries.AdminSalesReports
{
    public sealed record GetAdminSalesReportCountsResponse(
        int All,
        int Success,
        int Pending,
        int Failed,
        int Rejected
    );
}

