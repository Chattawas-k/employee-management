using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.BulkUpdate
{
    public sealed record BulkUpdateResponse(
        int UpdatedCount,
        int DeletedCount,
        DateTimeOffset UpdatedDate
    );
}

