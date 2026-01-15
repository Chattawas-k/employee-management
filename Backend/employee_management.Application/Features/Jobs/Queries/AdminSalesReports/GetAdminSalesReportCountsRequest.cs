using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.AdminSalesReports
{
    public sealed record GetAdminSalesReportCountsRequest(
        DateTime? DateFrom = null,
        DateTime? DateTo = null,
        Guid? AssigneeId = null,
        string? Search = null
    ) : IRequest<GetAdminSalesReportCountsResponse>;
}

