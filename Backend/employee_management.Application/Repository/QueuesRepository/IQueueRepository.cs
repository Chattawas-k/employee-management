using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Repository.QueuesRepository
{
    public interface IQueueRepository : IBaseRepository<Queue>
    {
        Task<List<Queue>> GetByDateAsync(DateTime date, CancellationToken cancellationToken);
        Task<Queue?> GetByEmployeeIdAndDateAsync(Guid employeeId, DateTime date, CancellationToken cancellationToken);
        Task<List<Queue>> GetActiveQueuesByDateAsync(DateTime date, CancellationToken cancellationToken);
        Task UpdateQueueStatusAsync(Guid employeeId, DateTime date, QueueStatus status, CancellationToken cancellationToken);
        Task UpdateAvailabilityStatusAsync(Guid employeeId, DateTime date, AvailabilityStatus availabilityStatus, CancellationToken cancellationToken);
        Task<Queue?> GetFirstAvailableStaffAsync(DateTime date, CancellationToken cancellationToken);
        Task RotateQueueToTailAsync(Guid employeeId, DateTime date, CancellationToken cancellationToken);
    }
}

