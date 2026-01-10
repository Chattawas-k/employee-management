using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Audit.GetAuditLog
{
    public sealed record GetAuditLogResponse(
        List<AuditLogDto> Logs,
        int TotalCount,
        int PageNumber,
        int PageSize
    );

    public sealed record AuditLogDto(
        Guid Id,
        Guid ActorId,
        string ActorName,
        AuditActionType ActionType,
        string EntityType,
        Guid EntityId,
        string? BeforeJson,
        string? AfterJson,
        string? Reason,
        DateTimeOffset Timestamp,
        string? IpAddress
    );
}
