using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;
using System.Linq.Dynamic.Core;
using employee_management.Application.Common.Models;

namespace employee_management.Persistence.Repository.EmployeesRepository
{
    public class EmployeeRepository : BaseRepository<Employee>, IEmployeeRepository
    {
        public EmployeeRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public new async Task<Employee?> Get(Guid id, CancellationToken cancellationToken)
        {
            return await Context.Employees
                .Include(e => e.Position)
                .ThenInclude(p => p!.Department)
                .Where(e => !e.IsDeleted)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        }

        public async Task<PaginatedList<Employee>> SearchAsync(string? keyword, int pageNumber, int pageSize, string? sortBy, string? sortDirection, EmployeeStatus? status, Guid? departmentId, Guid? positionId, CancellationToken cancellationToken)
        {
            IQueryable<Employee> query = Context.Employees
                .Include(e => e.Position)
                .ThenInclude(p => p!.Department)
                .Where(e => !e.IsDeleted);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(e =>
                    (e.Name != null && EF.Functions.ILike(e.Name, $"%{keyword}%")) ||
                    (e.Phone != null && EF.Functions.ILike(e.Phone, $"%{keyword}%")) ||
                    (e.Position != null && e.Position.Name != null && EF.Functions.ILike(e.Position.Name, $"%{keyword}%")) ||
                    (e.Position != null && e.Position.Department != null && e.Position.Department.Name != null && EF.Functions.ILike(e.Position.Department.Name, $"%{keyword}%")));
            }

            // Filter by status
            if (status.HasValue)
            {
                query = query.Where(e => e.Status == status.Value);
            }

            // Filter by department
            if (departmentId.HasValue)
            {
                query = query.Where(e => e.Position != null && e.Position.DepartmentId == departmentId.Value);
            }

            // Filter by position
            if (positionId.HasValue)
            {
                query = query.Where(e => e.PositionId == positionId.Value);
            }

            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                var direction = sortDirection?.ToLower() == "desc" ? "descending" : "ascending";
                query = query.OrderBy($"{sortBy} {direction}");
            }
            else
            {
                query = query.OrderBy(e => e.CreatedDate);
            }

            return await PaginatedList<Employee>.CreateAsync(query, pageNumber, pageSize);
        }

        public async Task<List<Employee>> GetJobAssignmentListAsync(string? keyword, CancellationToken cancellationToken)
        {
            IQueryable<Employee> query = Context.Employees
                .Include(e => e.Position)
                .ThenInclude(p => p!.Department)
                .Where(e => !e.IsDeleted);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(e =>
                    (e.Name != null && EF.Functions.ILike(e.Name, $"%{keyword}%")) ||
                    (e.Phone != null && EF.Functions.ILike(e.Phone, $"%{keyword}%")) ||
                    (e.Position != null && e.Position.Name != null && EF.Functions.ILike(e.Position.Name, $"%{keyword}%")) ||
                    (e.Position != null && e.Position.Department != null && e.Position.Department.Name != null && EF.Functions.ILike(e.Position.Department.Name, $"%{keyword}%")));
            }

            // Order by name for consistent queue position calculation
            query = query.OrderBy(e => e.Name);

            return await query.ToListAsync(cancellationToken);
        }
    }
}

