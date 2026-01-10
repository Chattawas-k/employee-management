using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Commands.Queue.Cancel
{
    public sealed record CancelResponse(
        Guid JobId,
        JobStatus Status
    );
}
