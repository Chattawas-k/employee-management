using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.Update
{
    public sealed record UpdateQueueRequest(
        Guid Id,
        int Position,
        QueueStatus Status
    ) : IRequest<UpdateQueueResponse>;
}

