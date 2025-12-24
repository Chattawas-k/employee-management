using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.DepartmentsRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.DepartmentsRepository
{
    public class DepartmentRepository : BaseRepository<Department>, IDepartmentRepository
    {
        public DepartmentRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public async Task<List<Department>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await Context.Departments
                .Where(d => d.IsActive && !d.IsDeleted)
                .OrderBy(d => d.Name)
                .ToListAsync(cancellationToken);
        }
    }
}

