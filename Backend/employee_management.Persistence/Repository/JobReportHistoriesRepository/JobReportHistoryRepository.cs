using employee_management.Application.Common.Services;
using employee_management.Application.Repository.JobReportHistoriesRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Repository.JobReportHistoriesRepository
{
    public class JobReportHistoryRepository : BaseRepository<JobReportHistory>, IJobReportHistoryRepository
    {
        public JobReportHistoryRepository(ApplicationDbContext context, ICurrentUserService currentUserService)
            : base(context, currentUserService)
        {
        }

        public async Task<List<JobReportHistory>> GetByJobIdAsync(
            Guid jobId,
            CancellationToken cancellationToken = default)
        {
            return await Context.JobReportHistories
                .AsNoTracking()
                .Include(h => h.EditedByEmployee)
                .Where(h => !h.IsDeleted && h.JobId == jobId)
                .OrderBy(h => h.EditedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> AnyForJobAsync(
            Guid jobId,
            CancellationToken cancellationToken = default)
        {
            return await Context.JobReportHistories
                .AsNoTracking()
                .AnyAsync(h => !h.IsDeleted && h.JobId == jobId, cancellationToken);
        }
    }
}
