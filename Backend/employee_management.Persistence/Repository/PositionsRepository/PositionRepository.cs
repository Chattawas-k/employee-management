using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.PositionsRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.PositionsRepository
{
    public class PositionRepository : BaseRepository<Position>, IPositionRepository
    {
        public PositionRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public async Task<List<Position>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await Context.Positions
                .Include(p => p.Department)
                .Where(p => p.IsActive && !p.IsDeleted)
                .OrderBy(p => p.Name)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Position>> GetByDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken)
        {
            return await Context.Positions
                .Include(p => p.Department)
                .Where(p => p.DepartmentId == departmentId && p.IsActive && !p.IsDeleted)
                .OrderBy(p => p.Name)
                .ToListAsync(cancellationToken);
        }
    }
}

