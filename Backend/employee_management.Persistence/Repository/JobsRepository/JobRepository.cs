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
    }
}

