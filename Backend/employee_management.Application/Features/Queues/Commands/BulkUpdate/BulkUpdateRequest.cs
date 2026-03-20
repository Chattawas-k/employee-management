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
        List<QueueUpdateItem> Queues,
        List<Guid>? DeletedQueueIds = null,
        /// <summary>
        /// When true, also updates InitialPosition to match the new Position.
        /// This makes the reorder persistent across daily resets (Master Queue change).
        /// When false (default), only Position is updated — affects today only.
        /// </summary>
        bool UpdateMaster = false
    ) : IRequest<BulkUpdateResponse>;
}

