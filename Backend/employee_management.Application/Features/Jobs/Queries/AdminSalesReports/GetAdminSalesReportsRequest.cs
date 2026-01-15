using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.AdminSalesReports
{
    public sealed record GetAdminSalesReportsRequest(
        string? Status = null,
        int? PageNumber = null,
        int? PageSize = null,
        DateTime? DateFrom = null,
        DateTime? DateTo = null,
        Guid? AssigneeId = null,
        string? Search = null
    ) : IRequest<employee_management.Application.Features.Jobs.Queries.GetSalesReports.GetSalesReportsResponse>;
}

