using MediatR;
using employee_management.Application.Repository.ProductCategoriesRepository;

namespace employee_management.Application.Features.ProductCategories.Queries.GetDropdownList
{
    public sealed class GetDropdownListHandler : IRequestHandler<GetDropdownListRequest, GetDropdownListResponse>
    {
        private readonly IProductCategoryRepository _productCategoryRepository;

        public GetDropdownListHandler(IProductCategoryRepository productCategoryRepository)
        {
            _productCategoryRepository = productCategoryRepository;
        }

        public async Task<GetDropdownListResponse> Handle(GetDropdownListRequest request, CancellationToken cancellationToken)
        {
            var categories = await _productCategoryRepository.GetActiveAsync(cancellationToken);

            var categoryDtos = categories.Select(c => new ProductCategoryDropdownDto(
                c.Id,
                c.Name
            )).ToList();

            return new GetDropdownListResponse(categoryDtos);
        }
    }
}
