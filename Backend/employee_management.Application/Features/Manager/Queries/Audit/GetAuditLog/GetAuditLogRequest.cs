using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Audit.GetAuditLog
{
    public sealed record GetAuditLogRequest(
        Guid? ActorId,
        AuditActionType? ActionType,
        string? EntityType,
        Guid? EntityId,
        DateTime? DateFrom,
        DateTime? DateTo,
        int PageNumber = 1,
        int PageSize = 50
    ) : IRequest<GetAuditLogResponse>;
}
