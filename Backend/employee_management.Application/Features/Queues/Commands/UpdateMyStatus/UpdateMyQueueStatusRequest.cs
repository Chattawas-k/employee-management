using MediatR;
using employee_management.Domain.Enums;
using System;

namespace employee_management.Application.Features.Queues.Commands.UpdateMyStatus
{
    public sealed record UpdateMyQueueStatusRequest(Guid EmployeeId, QueueStatus Status) : IRequest<UpdateMyQueueStatusResponse>;
}

