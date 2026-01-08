using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.EmployeeStatusHistoryRepository
{
    public class EmployeeStatusHistoryRepository : BaseRepository<EmployeeStatusHistory>, IEmployeeStatusHistoryRepository
    {
        public EmployeeStatusHistoryRepository(ApplicationDbContext context, ICurrentUserService currentUserService) 
            : base(context, currentUserService)
        {
        }

        public async Task<List<EmployeeStatusHistory>> GetByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default)
        {
            return await Context.EmployeeStatusHistories
                .Include(e => e.Employee)
                .Include(e => e.ChangedByEmployee)
                .Where(e => !e.IsDeleted && e.EmployeeId == employeeId)
                .OrderByDescending(e => e.ChangedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<EmployeeStatusHistory>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
        {
            return await Context.EmployeeStatusHistories
                .Include(e => e.Employee)
                .Include(e => e.ChangedByEmployee)
                .Where(e => !e.IsDeleted && e.ChangedDate >= startDate && e.ChangedDate <= endDate)
                .OrderByDescending(e => e.ChangedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<EmployeeStatusHistory>> GetByEmployeeIdAndDateRangeAsync(Guid employeeId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
        {
            return await Context.EmployeeStatusHistories
                .Include(e => e.Employee)
                .Include(e => e.ChangedByEmployee)
                .Where(e => !e.IsDeleted && e.EmployeeId == employeeId && e.ChangedDate >= startDate && e.ChangedDate <= endDate)
                .OrderByDescending(e => e.ChangedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<EmployeeStatusHistory>> GetByChangeReasonAsync(ChangeReason changeReason, CancellationToken cancellationToken = default)
        {
            return await Context.EmployeeStatusHistories
                .Include(e => e.Employee)
                .Include(e => e.ChangedByEmployee)
                .Where(e => !e.IsDeleted && e.ChangeReason == changeReason)
                .OrderByDescending(e => e.ChangedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<EmployeeStatusHistory>> GetFilteredAsync(Guid? employeeId, DateTime? startDate, DateTime? endDate, ChangeReason? changeReason, CancellationToken cancellationToken = default)
        {
            var query = Context.EmployeeStatusHistories
                .Include(e => e.Employee)
                .Include(e => e.ChangedByEmployee)
                .Where(e => !e.IsDeleted);

            if (employeeId.HasValue)
            {
                query = query.Where(e => e.EmployeeId == employeeId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(e => e.ChangedDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.ChangedDate <= endDate.Value);
            }

            if (changeReason.HasValue)
            {
                query = query.Where(e => e.ChangeReason == changeReason.Value);
            }

            return await query
                .OrderByDescending(e => e.ChangedDate)
                .ToListAsync(cancellationToken);
        }
    }
}

