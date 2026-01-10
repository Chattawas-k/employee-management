using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.AuditLogsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.AuditLogsRepository
{
    public class AuditLogRepository : BaseRepository<AuditLog>, IAuditLogRepository
    {
        public AuditLogRepository(ApplicationDbContext context, ICurrentUserService currentUserService) 
            : base(context, currentUserService)
        {
        }

        public async Task<List<AuditLog>> SearchAsync(
            Guid? actorId,
            AuditActionType? actionType,
            string? entityType,
            Guid? entityId,
            DateTime? dateFrom,
            DateTime? dateTo,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken)
        {
            var query = Context.AuditLogs.AsQueryable();

            if (actorId.HasValue)
            {
                query = query.Where(a => a.ActorId == actorId.Value);
            }

            if (actionType.HasValue)
            {
                query = query.Where(a => a.ActionType == actionType.Value);
            }

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(a => a.EntityType == entityType);
            }

            if (entityId.HasValue)
            {
                query = query.Where(a => a.EntityId == entityId.Value);
            }

            if (dateFrom.HasValue)
            {
                query = query.Where(a => a.Timestamp >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(a => a.Timestamp <= dateTo.Value);
            }

            return await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
        }
    }
}
