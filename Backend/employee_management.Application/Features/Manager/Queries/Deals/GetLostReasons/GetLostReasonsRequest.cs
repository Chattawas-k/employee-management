using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Deals.GetLostReasons
{
    public sealed record GetLostReasonsRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<GetLostReasonsResponse>;
}
