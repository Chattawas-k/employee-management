using employee_management.Application.Common.Services;
using employee_management.Application.Repository.SalesReasonsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Repository.SalesReasonsRepository
{
    public sealed class SalesReasonRepository : BaseRepository<SalesReason>, ISalesReasonRepository
    {
        public SalesReasonRepository(ApplicationDbContext context, ICurrentUserService currentUserService)
            : base(context, currentUserService)
        {
        }

        public async Task<List<SalesReason>> GetByTypeAsync(SalesReasonType type, bool includeInactive, CancellationToken cancellationToken)
        {
            var query = Context.SalesReasons
                .Where(r => !r.IsDeleted && r.Type == type);

            if (!includeInactive)
            {
                query = query.Where(r => r.IsActive);
            }

            return await query
                .OrderBy(r => r.SortOrder)
                .ThenBy(r => r.Label)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<SalesReason>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken)
        {
            if (ids == null || ids.Count == 0)
            {
                return new List<SalesReason>();
            }

            return await Context.SalesReasons
                .Where(r => !r.IsDeleted && ids.Contains(r.Id))
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> ExistsAsync(SalesReasonType type, string label, Guid? excludeId, CancellationToken cancellationToken)
        {
            var normalized = label.Trim().ToLower();

            var query = Context.SalesReasons
                .Where(r => !r.IsDeleted && r.Type == type && r.Label.ToLower() == normalized);

            if (excludeId.HasValue)
            {
                query = query.Where(r => r.Id != excludeId.Value);
            }

            return await query.AnyAsync(cancellationToken);
        }
    }
}

