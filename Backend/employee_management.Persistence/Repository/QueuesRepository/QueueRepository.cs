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
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
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
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
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
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
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
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            
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
                    AvailabilityStatus = Domain.Enums.AvailabilityStatus.Available, // Default
                    QueueDate = targetDate
                };
                Context.Queues.Add(newQueue);
            }
        }

        public async Task<Queue> UpdateAvailabilityStatusAsync(Guid employeeId, DateTime date, AvailabilityStatus availabilityStatus, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTime Kind issues with PostgreSQL
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            
            var queue = await GetByEmployeeIdAndDateAsync(employeeId, date, cancellationToken);
            if (queue != null)
            {
                queue.AvailabilityStatus = availabilityStatus;
                
                // Map AvailabilityStatus to QueueStatus for queue logic
                QueueStatus queueStatus = availabilityStatus switch
                {
                    AvailabilityStatus.Available => QueueStatus.Active,
                    AvailabilityStatus.Busy => QueueStatus.Busy,
                    AvailabilityStatus.LunchBreak => QueueStatus.Inactive,
                    AvailabilityStatus.Unavailable => QueueStatus.Inactive,
                    AvailabilityStatus.Leave => QueueStatus.Inactive,
                    AvailabilityStatus.OffsiteCustomer => QueueStatus.Inactive,
                    _ => QueueStatus.Active
                };
                queue.Status = queueStatus;
                
                Context.Queues.Update(queue);
                return queue;
            }
            else
            {
                // If no queue exists for today, create a new one
                var queuesForToday = await GetByDateAsync(date, cancellationToken);
                var maxPosition = queuesForToday.Any() ? queuesForToday.Max(q => q.Position) : 0;

                QueueStatus queueStatus = availabilityStatus switch
                {
                    AvailabilityStatus.Available => QueueStatus.Active,
                    AvailabilityStatus.Busy => QueueStatus.Busy,
                    AvailabilityStatus.LunchBreak => QueueStatus.Inactive,
                    AvailabilityStatus.Unavailable => QueueStatus.Inactive,
                    AvailabilityStatus.Leave => QueueStatus.Inactive,
                    AvailabilityStatus.OffsiteCustomer => QueueStatus.Inactive,
                    _ => QueueStatus.Active
                };

                var newQueue = new Queue
                {
                    EmployeeId = employeeId,
                    Position = maxPosition + 1,
                    Status = queueStatus,
                    AvailabilityStatus = availabilityStatus,
                    QueueDate = targetDate
                };
                Context.Queues.Add(newQueue);
                return newQueue;
            }
        }

        public async Task<Queue?> GetFirstAvailableStaffAsync(DateTime date, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTime Kind issues with PostgreSQL
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            var nextDate = targetDate.AddDays(1);
            
            return await Context.Queues
                .Include(q => q.Employee)
                .ThenInclude(e => e!.Position)
                .ThenInclude(p => p!.Department)
                .Where(q => q.QueueDate >= targetDate && q.QueueDate < nextDate && q.Status == QueueStatus.Active && !q.IsDeleted)
                // Fair ordering: Round ASC, then Master Queue (Position) ASC
                .OrderBy(q => q.Round < 1 ? 1 : q.Round)
                .ThenBy(q => q.Position)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task RotateQueueToTailAsync(Guid employeeId, DateTime date, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTime Kind issues with PostgreSQL
            var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            var nextDate = targetDate.AddDays(1);
            
            // Get all queues for the date, ordered by position
            // Use AsNoTracking to avoid tracking issues, then update explicitly
            var allQueues = await Context.Queues
                .Where(q => q.QueueDate >= targetDate && q.QueueDate < nextDate && !q.IsDeleted)
                .OrderBy(q => q.Position)
                .ToListAsync(cancellationToken);
            
            if (!allQueues.Any())
            {
                return; // No queues to rotate
            }
            
            // Find the staff's queue entry
            var staffQueue = allQueues.FirstOrDefault(q => q.EmployeeId == employeeId);
            if (staffQueue == null)
            {
                return; // Staff not in queue
            }
            
            var currentPosition = staffQueue.Position;
            var maxPosition = allQueues.Max(q => q.Position);
            
            // If already at tail, no rotation needed
            if (currentPosition == maxPosition)
            {
                return;
            }
            
            // Reload staffQueue with tracking for update
            var staffQueueToUpdate = await Context.Queues
                .FirstOrDefaultAsync(q => q.Id == staffQueue.Id, cancellationToken);
            
            if (staffQueueToUpdate == null)
            {
                return;
            }
            
            // Move all staff after this position up by 1
            var queuesToUpdate = await Context.Queues
                .Where(q => q.QueueDate >= targetDate && q.QueueDate < nextDate 
                    && !q.IsDeleted 
                    && q.Position > currentPosition)
                .ToListAsync(cancellationToken);
            
            foreach (var queue in queuesToUpdate)
            {
                queue.Position = queue.Position - 1;
                Context.Queues.Update(queue);
            }
            
            // Move accepted staff to tail
            staffQueueToUpdate.Position = maxPosition;
            Context.Queues.Update(staffQueueToUpdate);
            
            // Note: Don't save here - let the calling method save via UnitOfWork
            // This ensures rotation and status update are in the same transaction
        }

        public async Task IncrementRoundAsync(Guid employeeId, DateTime date, CancellationToken cancellationToken)
        {
            var queue = await GetByEmployeeIdAndDateAsync(employeeId, date, cancellationToken);
            if (queue == null)
            {
                return;
            }

            // Round must be >= 1 (Round=1 means "not received any job today yet")
            if (queue.Round < 1)
            {
                queue.Round = 1;
            }

            queue.Round += 1;
            Context.Queues.Update(queue);
        }
    }
}

