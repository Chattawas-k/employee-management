using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.JobReportHistoriesRepository
{
    public interface IJobReportHistoryRepository : IBaseRepository<JobReportHistory>
    {
        Task<List<JobReportHistory>> GetByJobIdAsync(
            Guid jobId,
            CancellationToken cancellationToken = default);

        Task<bool> AnyForJobAsync(
            Guid jobId,
            CancellationToken cancellationToken = default);
    }
}
