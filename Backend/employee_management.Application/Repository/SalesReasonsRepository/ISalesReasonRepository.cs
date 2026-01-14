using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Repository.SalesReasonsRepository
{
    public interface ISalesReasonRepository : IBaseRepository<SalesReason>
    {
        Task<List<SalesReason>> GetByTypeAsync(SalesReasonType type, bool includeInactive, CancellationToken cancellationToken);
        Task<List<SalesReason>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(SalesReasonType type, string label, Guid? excludeId, CancellationToken cancellationToken);
    }
}

