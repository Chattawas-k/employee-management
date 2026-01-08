using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.BulkUpdate
{
    public sealed record QueueUpdateItem(
        Guid Id,
        int Position,
        QueueStatus Status
    );

    public sealed record BulkUpdateRequest(
        List<QueueUpdateItem> Queues
    ) : IRequest<BulkUpdateResponse>;
}

