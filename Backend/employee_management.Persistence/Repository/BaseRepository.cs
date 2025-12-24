using Microsoft.EntityFrameworkCore;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Domain.Common;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;

namespace employee_management.Persistence.Repository
{
    public class BaseRepository<T> : IBaseRepository<T> where T : BaseEntity
    {
        protected readonly ApplicationDbContext Context;
        private readonly ICurrentUserService _currentUserService;

        public BaseRepository(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            Context = context;
            _currentUserService = currentUserService;
        }

        public void Create(T entity)
        {
            entity.CreatedDate = DateTimeOffset.UtcNow;
            entity.UpdatedDate = DateTimeOffset.UtcNow;
            entity.CreatedBy = _currentUserService.UserId ?? Guid.Empty;
            entity.UpdatedBy = _currentUserService.UserId ?? Guid.Empty;
            Context.Add(entity);
        }

        public void Update(T entity)
        {
            entity.UpdatedDate = DateTimeOffset.UtcNow;
            entity.UpdatedBy = _currentUserService.UserId ?? Guid.Empty;
            Context.Update(entity);
        }

        public void Delete(T entity)
        {
            entity.DeletedDate = DateTimeOffset.UtcNow;
            entity.UpdatedBy = _currentUserService.UserId ?? Guid.Empty;
            entity.IsDeleted = true;
            Context.Update(entity);
        }

        public async Task<T?> Get(Guid id, CancellationToken cancellationToken)
        {
            return await Context.Set<T>()
                .Where(x => !x.IsDeleted)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<List<T>> GetAll(CancellationToken cancellationToken)
        {
            return await Context.Set<T>()
                .Where(x => !x.IsDeleted)
                .ToListAsync(cancellationToken);
        }
    }
}
