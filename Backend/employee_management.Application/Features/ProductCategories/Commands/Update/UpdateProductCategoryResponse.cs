namespace employee_management.Application.Features.ProductCategories.Commands.Update
{
    public sealed record UpdateProductCategoryResponse(
        Guid Id,
        string Name,
        string? Description,
        bool IsActive
    );
}
