using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.Update
{
    public sealed record UpdateQueueResponse(
        Guid Id,
        int Position,
        QueueStatus Status,
        DateTimeOffset UpdatedDate
    );
}

