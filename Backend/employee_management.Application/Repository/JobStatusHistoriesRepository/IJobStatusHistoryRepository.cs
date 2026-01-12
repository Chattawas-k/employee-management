using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Repository.JobStatusHistoriesRepository
{
    public interface IJobStatusHistoryRepository : IBaseRepository<JobStatusHistory>
    {
        Task<List<JobStatusHistory>> GetMyJobStatusHistoryAsync(
            Guid employeeId,
            DateTime? startDate,
            DateTime? endDate,
            JobChangeSource? changeSource,
            Guid? jobId,
            int skip,
            int take,
            CancellationToken cancellationToken = default);
    }
}

