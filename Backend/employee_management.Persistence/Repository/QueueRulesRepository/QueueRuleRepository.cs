using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.QueueRulesRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.QueueRulesRepository
{
    public class QueueRuleRepository : BaseRepository<QueueRule>, IQueueRuleRepository
    {
        public QueueRuleRepository(ApplicationDbContext context, ICurrentUserService currentUserService) 
            : base(context, currentUserService)
        {
        }

        public async Task<QueueRule?> GetActiveRuleAsync(CancellationToken cancellationToken)
        {
            return await Context.QueueRules
                .Where(r => r.IsActive && !r.IsDeleted)
                .OrderByDescending(r => r.CreatedDate)
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}
