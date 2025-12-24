using Microsoft.EntityFrameworkCore.Storage;

namespace employee_management.Application.Repository
{
    public interface IUnitOfWork
    {
        Task Save(CancellationToken cancellationToken);
        Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    }
}
