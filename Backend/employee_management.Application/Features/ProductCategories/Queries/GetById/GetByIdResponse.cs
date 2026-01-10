namespace employee_management.Application.Features.ProductCategories.Queries.GetById
{
    public sealed record GetByIdResponse(
        ProductCategoryDto? ProductCategory
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
