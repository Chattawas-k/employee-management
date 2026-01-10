using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Queue.GetTickets
{
    public sealed record GetTicketsRequest(
        JobStatus? Status,
        DateTime? DateFrom,
        DateTime? DateTo,
        string? Channel,
        string? Category,
        Guid? AssignedStaffId,
        bool? IsSlaAtRisk,
        bool? IsEscalated,
        int PageNumber = 1,
        int PageSize = 50
    ) : IRequest<GetTicketsResponse>;
}
