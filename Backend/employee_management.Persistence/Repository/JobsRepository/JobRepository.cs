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

        public async Task<List<Job>> GetSalesReportsAsync(Guid employeeId, string? status, CancellationToken cancellationToken)
        {
            // Use EF Core LINQ with proper filtering
            // Filter by AssigneeId (EmployeeId) to show only jobs assigned to the current employee
            // Note: Report is a computed property, so we filter by ReportJson in the query
            // and then filter by Report.SalesStatus in memory after deserialization
            var query = Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && j.AssigneeId == employeeId && j.ReportJson != null);

            // Execute query first to get jobs with reports
            var jobs = await query
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);

            // Filter by status in memory after deserialization
            if (!string.IsNullOrWhiteSpace(status))
            {
                var statusLower = status.ToLower();
                jobs = jobs.Where(j => 
                    j.Report != null && 
                    j.Report.SalesStatus.ToLower() == statusLower).ToList();
            }
            else
            {
                // Only return jobs that have valid reports
                jobs = jobs.Where(j => j.Report != null).ToList();
            }

            return jobs;
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

        public async Task<List<Job>> GetAllJobsAsync(CancellationToken cancellationToken)
        {
            // StatusLogs is a computed property that deserializes from StatusLogsJson column
            // It's configured as Ignore in ApplicationDbContext, so we don't need to Include it
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted)
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }
    }
}

