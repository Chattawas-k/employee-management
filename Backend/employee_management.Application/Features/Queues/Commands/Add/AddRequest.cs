using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.Add
{
    public sealed record AddQueueRequest(
        Guid EmployeeId,
        int Position,
        QueueStatus Status,
        DateTime QueueDate
    ) : IRequest<AddQueueResponse>;
}

