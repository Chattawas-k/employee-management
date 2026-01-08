using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Repository
{
    public interface IEmployeeStatusHistoryRepository : IBaseRepository<EmployeeStatusHistory>
    {
        Task<List<EmployeeStatusHistory>> GetByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default);
        Task<List<EmployeeStatusHistory>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
        Task<List<EmployeeStatusHistory>> GetByEmployeeIdAndDateRangeAsync(Guid employeeId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
        Task<List<EmployeeStatusHistory>> GetByChangeReasonAsync(ChangeReason changeReason, CancellationToken cancellationToken = default);
        Task<List<EmployeeStatusHistory>> GetFilteredAsync(Guid? employeeId, DateTime? startDate, DateTime? endDate, ChangeReason? changeReason, CancellationToken cancellationToken = default);
    }
}

