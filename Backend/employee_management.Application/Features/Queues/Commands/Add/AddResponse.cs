using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.Add
{
    public sealed record AddQueueResponse(
        Guid Id,
        Guid EmployeeId,
        int Position,
        QueueStatus Status,
        DateTime QueueDate,
        DateTimeOffset CreatedDate
    );
}

