using MediatR;
using employee_management.Application.Repository.ProductCategoriesRepository;

namespace employee_management.Application.Features.ProductCategories.Queries.GetById
{
    public sealed class GetByIdHandler : IRequestHandler<GetByIdRequest, GetByIdResponse>
    {
        private readonly IProductCategoryRepository _productCategoryRepository;

        public GetByIdHandler(IProductCategoryRepository productCategoryRepository)
        {
            _productCategoryRepository = productCategoryRepository;
        }

        public async Task<GetByIdResponse> Handle(GetByIdRequest request, CancellationToken cancellationToken)
        {
            var category = await _productCategoryRepository.Get(request.Id, cancellationToken);

            if (category == null || category.IsDeleted)
            {
                return new GetByIdResponse(null);
            }

            var categoryDto = new ProductCategoryDto(
                category.Id,
                category.Name,
                category.Description,
                category.IsActive,
                category.CreatedDate,
                category.UpdatedDate
            );

            return new GetByIdResponse(categoryDto);
        }
    }
}
