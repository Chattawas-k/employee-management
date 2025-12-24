using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.PositionsRepository
{
    public interface IPositionRepository : IBaseRepository<Position>
    {
        Task<List<Position>> GetAllAsync(CancellationToken cancellationToken);
        Task<List<Position>> GetByDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken);
    }
}

