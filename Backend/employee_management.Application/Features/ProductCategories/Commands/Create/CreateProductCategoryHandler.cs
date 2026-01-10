using MediatR;
using employee_management.Application.Repository.ProductCategoriesRepository;
using employee_management.Application.Repository;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.ProductCategories.Commands.Create
{
    public sealed class CreateProductCategoryHandler : IRequestHandler<CreateProductCategoryRequest, CreateProductCategoryResponse>
    {
        private readonly IProductCategoryRepository _productCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateProductCategoryHandler(
            IProductCategoryRepository productCategoryRepository,
            IUnitOfWork unitOfWork)
        {
            _productCategoryRepository = productCategoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<CreateProductCategoryResponse> Handle(CreateProductCategoryRequest request, CancellationToken cancellationToken)
        {
            // Check if name already exists
            var exists = await _productCategoryRepository.ExistsByNameAsync(request.Name, null, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException($"Product category with name '{request.Name}' already exists.");
            }

            var productCategory = new ProductCategory
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                IsActive = true,
                CreatedDate = DateTimeOffset.UtcNow,
                IsDeleted = false
            };

            _productCategoryRepository.Create(productCategory);
            await _unitOfWork.Save(cancellationToken);

            return new CreateProductCategoryResponse(
                productCategory.Id,
                productCategory.Name,
                productCategory.Description,
                productCategory.IsActive
            );
        }
    }
}
