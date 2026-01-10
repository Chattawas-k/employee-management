using MediatR;

namespace employee_management.Application.Features.Manager.Commands.Queue.Cancel
{
    public sealed record CancelRequest(
        Guid JobId,
        string Reason
    ) : IRequest<CancelResponse>;
}
