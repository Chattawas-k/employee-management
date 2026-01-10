using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.ProductCategoriesRepository
{
    public interface IProductCategoryRepository : IBaseRepository<ProductCategory>
    {
        Task<List<ProductCategory>> GetActiveAsync(CancellationToken cancellationToken);
        Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default);
    }
}
