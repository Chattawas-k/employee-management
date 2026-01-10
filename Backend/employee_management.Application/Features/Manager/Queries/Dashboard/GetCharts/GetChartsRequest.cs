using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetCharts
{
    public sealed record GetChartsRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<GetChartsResponse>;
}
