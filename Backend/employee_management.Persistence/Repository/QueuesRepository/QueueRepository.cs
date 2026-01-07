using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
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
            // Convert to UTC to avoid DateTime Kind issues with PostgreSQL
            var targetDate = date.Date.ToUniversalTime();
            var nextDate = targetDate.AddDays(1);
            
            return await Context.Queues
                .Include(q => q.Employee)
                .ThenInclude(e => e!.Position)
                .ThenInclude(p => p!.Department)
                .Where(q => q.QueueDate >= targetDate && q.QueueDate < nextDate && !q.IsDeleted)
                .OrderBy(q => q.Position)
                .ToListAsync(cancellationToken);
        }

        public async Task<Queue?> GetByEmployeeIdAndDateAsync(Guid employeeId, DateTime date, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTime Kind issues with PostgreSQL
            var targetDate = date.Date.ToUniversalTime();
            var nextDate = targetDate.AddDays(1);
            
            return await Context.Queues
                .Include(q => q.Employee)
                .ThenInclude(e => e!.Position)
                .ThenInclude(p => p!.Department)
                .FirstOrDefaultAsync(q => q.EmployeeId == employeeId && q.QueueDate >= targetDate && q.QueueDate < nextDate && !q.IsDeleted, cancellationToken);
        }

        public async Task<List<Queue>> GetActiveQueuesByDateAsync(DateTime date, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTime Kind issues with PostgreSQL
            var targetDate = date.Date.ToUniversalTime();
            var nextDate = targetDate.AddDays(1);
            
            return await Context.Queues
                .Include(q => q.Employee)
                .ThenInclude(e => e!.Position)
                .ThenInclude(p => p!.Department)
                .Where(q => q.QueueDate >= targetDate && q.QueueDate < nextDate && q.Status == QueueStatus.Active && !q.IsDeleted)
                .OrderBy(q => q.Position)
                .ToListAsync(cancellationToken);
        }

        public async Task UpdateQueueStatusAsync(Guid employeeId, DateTime date, QueueStatus status, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTime Kind issues with PostgreSQL
            var targetDate = date.Date.ToUniversalTime();
            
            var queue = await GetByEmployeeIdAndDateAsync(employeeId, date, cancellationToken);
            if (queue != null)
            {
                queue.Status = status;
                Context.Queues.Update(queue);
            }
            else
            {
                // If no queue exists for today, create a new one
                var queuesForToday = await GetByDateAsync(date, cancellationToken);
                var maxPosition = queuesForToday.Any() ? queuesForToday.Max(q => q.Position) : 0;

                var newQueue = new Queue
                {
                    EmployeeId = employeeId,
                    Position = maxPosition + 1,
                    Status = status,
                    QueueDate = targetDate
                };
                Context.Queues.Add(newQueue);
            }
        }
    }
}

