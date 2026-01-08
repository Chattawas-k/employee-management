using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.WaitingJobsRepository
{
    public interface IWaitingJobRepository : IBaseRepository<WaitingJob>
    {
        Task<List<WaitingJob>> GetPendingWaitingJobsAsync(CancellationToken cancellationToken);
        Task<WaitingJob?> GetByJobIdAsync(Guid jobId, CancellationToken cancellationToken);
    }
}

