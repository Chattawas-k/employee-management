using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Deals.GetDealsSummary
{
    public sealed record GetDealsSummaryRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<GetDealsSummaryResponse>;
}
