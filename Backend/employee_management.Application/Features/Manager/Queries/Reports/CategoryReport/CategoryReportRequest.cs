using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Reports.CategoryReport
{
    public sealed record CategoryReportRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<CategoryReportResponse>;
}
