namespace employee_management.Application.Features.ProductCategories.Queries.GetAll
{
    public sealed record GetAllResponse(
        List<ProductCategoryDto> ProductCategories
    );

    public sealed record ProductCategoryDto(
        Guid Id,
        string Name,
        string? Description,
        bool IsActive,
        DateTimeOffset CreatedDate,
        DateTimeOffset? UpdatedDate
    );
}
