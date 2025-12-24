using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.QueuesRepository
{
    public interface IQueueRepository : IBaseRepository<Queue>
    {
        Task<List<Queue>> GetByDateAsync(DateTime date, CancellationToken cancellationToken);
        Task<Queue?> GetByEmployeeIdAndDateAsync(Guid employeeId, DateTime date, CancellationToken cancellationToken);
        Task<List<Queue>> GetActiveQueuesByDateAsync(DateTime date, CancellationToken cancellationToken);
    }
}

