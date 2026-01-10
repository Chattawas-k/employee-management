using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.QueueRulesRepository
{
    public interface IQueueRuleRepository : IBaseRepository<QueueRule>
    {
        Task<QueueRule?> GetActiveRuleAsync(CancellationToken cancellationToken);
    }
}
