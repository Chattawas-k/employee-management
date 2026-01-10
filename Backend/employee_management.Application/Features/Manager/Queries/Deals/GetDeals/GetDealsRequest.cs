using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Deals.GetDeals
{
    public sealed record GetDealsRequest(
        DateTime? DateFrom,
        DateTime? DateTo,
        Guid? StaffId,
        string? Category,
        string? Channel,
        JobStatus? Outcome
    ) : IRequest<GetDealsResponse>;
}
