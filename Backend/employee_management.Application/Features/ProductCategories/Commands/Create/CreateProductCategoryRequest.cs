using MediatR;

namespace employee_management.Application.Features.ProductCategories.Commands.Create
{
    public sealed record CreateProductCategoryRequest(
        string Name,
        string? Description
    ) : IRequest<CreateProductCategoryResponse>;
}
