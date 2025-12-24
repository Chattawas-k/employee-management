using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.JobsRepository
{
    public interface IJobRepository : IBaseRepository<Job>
    {
        Task<List<Job>> GetMyTasksAsync(Guid employeeId, CancellationToken cancellationToken);
    }
}

