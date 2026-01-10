using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Reports.LostReasons
{
    public sealed record LostReasonsRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<LostReasonsResponse>;
}
