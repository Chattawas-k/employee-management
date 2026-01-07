using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.JobsRepository
{
    public class JobRepository : BaseRepository<Job>, IJobRepository
    {
        public JobRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public new async Task<Job?> Get(Guid id, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted)
                .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
        }

        public async Task<List<Job>> GetMyTasksAsync(Guid employeeId, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && j.AssigneeId == employeeId)
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Job>> GetSalesReportsAsync(Guid userId, string? status, CancellationToken cancellationToken)
        {
            // Use EF Core LINQ with proper filtering
            // Filter by CreatedBy (UserId) to show only reports created by the current user
            var query = Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && j.CreatedBy == userId);

            // Filter by status if provided
            if (!string.IsNullOrWhiteSpace(status))
            {
                var statusLower = status.ToLower();
                // Filter jobs where Report.SalesStatus matches (case-insensitive)
                // We need to deserialize JSON and check SalesStatus
                query = query.Where(j => 
                    j.ReportJson != null && 
                    j.Report != null && 
                    j.Report.SalesStatus.ToLower() == statusLower);
            }
            else
            {
                // Only filter jobs that have reports
                query = query.Where(j => j.ReportJson != null && j.Report != null);
            }

            // Order and execute
            return await query
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<int> CountJobsByDateAsync(DateTime date, CancellationToken cancellationToken)
        {
            // Convert to DateTimeOffset to avoid timezone issues with PostgreSQL
            var targetDate = new DateTimeOffset(date.Date, TimeSpan.Zero);
            var nextDate = targetDate.AddDays(1);
            
            return await Context.Jobs
                .Where(j => !j.IsDeleted && 
                           j.CreatedDate >= targetDate && 
                           j.CreatedDate < nextDate)
                .CountAsync(cancellationToken);
        }
    }
}

