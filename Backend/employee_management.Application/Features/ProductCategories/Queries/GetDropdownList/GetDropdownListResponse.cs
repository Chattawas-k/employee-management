namespace employee_management.Application.Features.ProductCategories.Queries.GetDropdownList
{
    public sealed record GetDropdownListResponse(
        List<ProductCategoryDropdownDto> ProductCategories
    );

    public sealed record ProductCategoryDropdownDto(
        Guid Id,
        string Name
    );
}
