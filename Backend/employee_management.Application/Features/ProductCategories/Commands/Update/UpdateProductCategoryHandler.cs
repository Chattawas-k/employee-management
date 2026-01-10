using MediatR;
using employee_management.Application.Repository.ProductCategoriesRepository;
using employee_management.Application.Repository;

namespace employee_management.Application.Features.ProductCategories.Commands.Update
{
    public sealed class UpdateProductCategoryHandler : IRequestHandler<UpdateProductCategoryRequest, UpdateProductCategoryResponse>
    {
        private readonly IProductCategoryRepository _productCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateProductCategoryHandler(
            IProductCategoryRepository productCategoryRepository,
            IUnitOfWork unitOfWork)
        {
            _productCategoryRepository = productCategoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<UpdateProductCategoryResponse> Handle(UpdateProductCategoryRequest request, CancellationToken cancellationToken)
        {
            var productCategory = await _productCategoryRepository.Get(request.Id, cancellationToken);
            if (productCategory == null || productCategory.IsDeleted)
            {
                throw new KeyNotFoundException($"Product category with ID '{request.Id}' not found.");
            }

            // Check if name already exists (excluding current record)
            var exists = await _productCategoryRepository.ExistsByNameAsync(request.Name, request.Id, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException($"Product category with name '{request.Name}' already exists.");
            }

            productCategory.Name = request.Name;
            productCategory.Description = request.Description;
            productCategory.IsActive = request.IsActive;
            productCategory.UpdatedDate = DateTimeOffset.UtcNow;

            _productCategoryRepository.Update(productCategory);
            await _unitOfWork.Save(cancellationToken);

            return new UpdateProductCategoryResponse(
                productCategory.Id,
                productCategory.Name,
                productCategory.Description,
                productCategory.IsActive
            );
        }
    }
}
