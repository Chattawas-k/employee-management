using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetKpis
{
    public sealed record GetKpisRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<GetKpisResponse>;
}
