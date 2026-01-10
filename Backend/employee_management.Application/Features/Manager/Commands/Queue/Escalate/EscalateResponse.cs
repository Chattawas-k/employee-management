using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Commands.Queue.Escalate
{
    public sealed record EscalateResponse(
        Guid JobId,
        bool IsEscalated,
        JobPriority Priority
    );
}
