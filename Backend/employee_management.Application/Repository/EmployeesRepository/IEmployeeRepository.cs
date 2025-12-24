using employee_management.Application.Common.Models;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Repository.EmployeesRepository
{
    public interface IEmployeeRepository : IBaseRepository<Employee>
    {
        Task<PaginatedList<Employee>> SearchAsync(string? keyword, int pageNumber, int pageSize, string? sortBy, string? sortDirection, EmployeeStatus? status, Guid? departmentId, Guid? positionId, CancellationToken cancellationToken);
    }
}

