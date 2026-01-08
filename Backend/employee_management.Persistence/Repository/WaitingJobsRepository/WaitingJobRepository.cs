using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.WaitingJobsRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.WaitingJobsRepository
{
    public class WaitingJobRepository : BaseRepository<WaitingJob>, IWaitingJobRepository
    {
        public WaitingJobRepository(ApplicationDbContext context, ICurrentUserService currentUserService) 
            : base(context, currentUserService)
        {
        }

        public async Task<List<WaitingJob>> GetPendingWaitingJobsAsync(CancellationToken cancellationToken)
        {
            return await Context.WaitingJobs
                .Include(w => w.Job)
                .Where(w => !w.IsDeleted && w.AssignedDate == null)
                .OrderBy(w => w.CreatedDate) // FIFO - first created, first assigned
                .ToListAsync(cancellationToken);
        }

        public async Task<WaitingJob?> GetByJobIdAsync(Guid jobId, CancellationToken cancellationToken)
        {
            return await Context.WaitingJobs
                .Include(w => w.Job)
                .FirstOrDefaultAsync(w => w.JobId == jobId && !w.IsDeleted, cancellationToken);
        }
    }
}

