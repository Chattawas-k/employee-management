using employee_management.Application.Common.Services;
using employee_management.Application.Repository.JobStatusHistoriesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Repository.JobStatusHistoriesRepository
{
    public class JobStatusHistoryRepository : BaseRepository<JobStatusHistory>, IJobStatusHistoryRepository
    {
        public JobStatusHistoryRepository(ApplicationDbContext context, ICurrentUserService currentUserService)
            : base(context, currentUserService)
        {
        }

        public async Task<List<JobStatusHistory>> GetMyJobStatusHistoryAsync(
            Guid employeeId,
            DateTime? startDate,
            DateTime? endDate,
            JobChangeSource? changeSource,
            Guid? jobId,
            int skip,
            int take,
            CancellationToken cancellationToken = default)
        {
            // History for jobs that are (currently) assigned to this employee.
            // This matches the "งานของฉัน" scope (myJobsOnly).
            var query = Context.JobStatusHistories
                .AsNoTracking()
                .Include(h => h.Job)
                .Include(h => h.ChangedByEmployee)
                .Where(h => !h.IsDeleted && h.Job != null && h.Job.AssigneeId == employeeId);

            if (startDate.HasValue)
            {
                query = query.Where(h => h.ChangedDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(h => h.ChangedDate <= endDate.Value);
            }

            if (changeSource.HasValue)
            {
                query = query.Where(h => h.ChangeSource == changeSource.Value);
            }

            if (jobId.HasValue && jobId.Value != Guid.Empty)
            {
                query = query.Where(h => h.JobId == jobId.Value);
            }

            skip = Math.Max(0, skip);
            take = take <= 0 ? 50 : Math.Min(take, 200);

            return await query
                .OrderByDescending(h => h.ChangedDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync(cancellationToken);
        }
    }
}

