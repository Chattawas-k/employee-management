using MediatR;
using employee_management.Application.Features.Jobs.Queries.ExportMySalesReports;

namespace employee_management.Application.Features.Jobs.Queries.AdminSalesReports
{
    public sealed record ExportAdminSalesReportsRequest(
        string? Status = null,
        DateTime? DateFrom = null,
        DateTime? DateTo = null,
        Guid? AssigneeId = null,
        string? Search = null
    ) : IRequest<ExportMySalesReportsResponse>;
}

