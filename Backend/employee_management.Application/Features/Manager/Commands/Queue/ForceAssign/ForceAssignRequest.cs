using MediatR;

namespace employee_management.Application.Features.Manager.Commands.Queue.ForceAssign
{
    public sealed record ForceAssignRequest(
        Guid JobId,
        Guid StaffId,
        string? Reason
    ) : IRequest<ForceAssignResponse>;
}
