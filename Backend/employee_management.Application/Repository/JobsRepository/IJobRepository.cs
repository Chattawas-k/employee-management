using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.JobsRepository
{
    public interface IJobRepository : IBaseRepository<Job>
    {
        Task<List<Job>> GetMyTasksAsync(Guid employeeId, CancellationToken cancellationToken);
        Task<List<Job>> GetSalesReportsAsync(Guid userId, string? status, CancellationToken cancellationToken);
        Task<int> CountJobsByDateAsync(DateTime date, CancellationToken cancellationToken);
        Task<List<Job>> GetAllJobsAsync(CancellationToken cancellationToken);
    }
}

