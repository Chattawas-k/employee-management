using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Repository.AuditLogsRepository
{
    public interface IAuditLogRepository : IBaseRepository<AuditLog>
    {
        Task<List<AuditLog>> SearchAsync(
            Guid? actorId,
            AuditActionType? actionType,
            string? entityType,
            Guid? entityId,
            DateTime? dateFrom,
            DateTime? dateTo,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken);
    }
}
