using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.MigrateInactiveStatus
{
    public sealed record MigrateInactiveStatusRequest(
        AvailabilityStatus TargetStatus  // Break or Unavailable
    ) : IRequest<MigrateInactiveStatusResponse>;
}

