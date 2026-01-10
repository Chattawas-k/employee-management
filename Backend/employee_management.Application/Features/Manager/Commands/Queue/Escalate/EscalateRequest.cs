using MediatR;

namespace employee_management.Application.Features.Manager.Commands.Queue.Escalate
{
    public sealed record EscalateRequest(
        Guid JobId,
        string? Reason
    ) : IRequest<EscalateResponse>;
}
