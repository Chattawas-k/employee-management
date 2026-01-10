using MediatR;

namespace employee_management.Application.Features.ProductCategories.Commands.Update
{
    public sealed record UpdateProductCategoryRequest(
        Guid Id,
        string Name,
        string? Description,
        bool IsActive
    ) : IRequest<UpdateProductCategoryResponse>;
}
