using MediatR;
using employee_management.Application.Repository.ProductCategoriesRepository;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Application.Features.ProductCategories.Queries.GetAll
{
    public sealed class GetAllHandler : IRequestHandler<GetAllRequest, GetAllResponse>
    {
        private readonly IProductCategoryRepository _productCategoryRepository;

        public GetAllHandler(IProductCategoryRepository productCategoryRepository)
        {
            _productCategoryRepository = productCategoryRepository;
        }

        public async Task<GetAllResponse> Handle(GetAllRequest request, CancellationToken cancellationToken)
        {
            var categories = await _productCategoryRepository.GetAll(cancellationToken);

            var categoryDtos = categories.Select(c => new ProductCategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.IsActive,
                c.CreatedDate,
                c.UpdatedDate
            )).OrderBy(c => c.Name).ToList();

            return new GetAllResponse(categoryDtos);
        }
    }
}
