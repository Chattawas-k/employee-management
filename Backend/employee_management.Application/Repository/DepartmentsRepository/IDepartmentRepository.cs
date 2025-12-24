using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.DepartmentsRepository
{
    public interface IDepartmentRepository : IBaseRepository<Department>
    {
        Task<List<Department>> GetAllAsync(CancellationToken cancellationToken);
    }
}

