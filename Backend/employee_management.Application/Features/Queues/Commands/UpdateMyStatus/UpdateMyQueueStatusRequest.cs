using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.UpdateMyStatus
{
    public sealed record UpdateMyQueueStatusRequest(Guid EmployeeId, AvailabilityStatus Status) : IRequest<UpdateMyQueueStatusResponse>;
}

