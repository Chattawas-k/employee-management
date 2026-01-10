namespace employee_management.Application.Features.ProductCategories.Commands.Create
{
    public sealed record CreateProductCategoryResponse(
        Guid Id,
        string Name,
        string? Description,
        bool IsActive
    );
}
