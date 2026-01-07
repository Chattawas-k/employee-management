using employee_management.Domain.Enums;
using System;

namespace employee_management.Application.Features.Queues.Commands.UpdateMyStatus
{
    public sealed record UpdateMyQueueStatusResponse(
        Guid Id,
        Guid EmployeeId,
        int Position,
        QueueStatus Status,
        DateTimeOffset? UpdatedDate
    );
}

