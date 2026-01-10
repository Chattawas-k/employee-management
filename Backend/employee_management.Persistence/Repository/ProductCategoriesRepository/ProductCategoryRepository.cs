using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.ProductCategoriesRepository;
using employee_management.Application.Common.Services;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;

namespace employee_management.Persistence.Repository.ProductCategoriesRepository
{
    public class ProductCategoryRepository : BaseRepository<ProductCategory>, IProductCategoryRepository
    {
        public ProductCategoryRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public async Task<List<ProductCategory>> GetActiveAsync(CancellationToken cancellationToken)
        {
            return await Context.ProductCategories
                .Where(pc => pc.IsActive && !pc.IsDeleted)
                .OrderBy(pc => pc.Name)
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default)
        {
            var query = Context.ProductCategories
                .Where(pc => pc.Name.ToLower() == name.ToLower() && !pc.IsDeleted);

            if (excludeId.HasValue)
            {
                query = query.Where(pc => pc.Id != excludeId.Value);
            }

            return await query.AnyAsync(cancellationToken);
        }
    }
}
