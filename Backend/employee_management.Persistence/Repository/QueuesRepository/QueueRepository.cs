using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.QueuesRepository
{
    public class QueueRepository : BaseRepository<Queue>, IQueueRepository
    {
        public QueueRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public async Task<List<Queue>> GetByDateAsync(DateTime date, CancellationToken cancellationToken)
        {
            return await Context.Queues
                .Include(q => q.Employee)
                .ThenInclude(e => e!.Position)
                .ThenInclude(p => p!.Department)
                .Where(q => q.QueueDate.Date == date.Date && !q.IsDeleted)
                .OrderBy(q => q.Position)
                .ToListAsync(cancellationToken);
        }

        public async Task<Queue?> GetByEmployeeIdAndDateAsync(Guid employeeId, DateTime date, CancellationToken cancellationToken)
        {
            return await Context.Queues
                .Include(q => q.Employee)
                .ThenInclude(e => e!.Position)
                .ThenInclude(p => p!.Department)
                .FirstOrDefaultAsync(q => q.EmployeeId == employeeId && q.QueueDate.Date == date.Date && !q.IsDeleted, cancellationToken);
        }

        public async Task<List<Queue>> GetActiveQueuesByDateAsync(DateTime date, CancellationToken cancellationToken)
        {
            return await Context.Queues
                .Include(q => q.Employee)
                .ThenInclude(e => e!.Position)
                .ThenInclude(p => p!.Department)
                .Where(q => q.QueueDate.Date == date.Date && q.Status == Domain.Enums.QueueStatus.Active && !q.IsDeleted)
                .OrderBy(q => q.Position)
                .ToListAsync(cancellationToken);
        }
    }
}

