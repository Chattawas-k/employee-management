using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.UpdateMyStatus
{
    public sealed record UpdateMyQueueStatusResponse(
        Guid Id,
        Guid EmployeeId,
        int Position,
        AvailabilityStatus AvailabilityStatus,
        QueueStatus Status,
        DateTimeOffset? UpdatedDate
    );
}

