using MediatR;

namespace employee_management.Application.Features.ProductCategories.Commands.Delete
{
    public sealed record DeleteProductCategoryRequest(
        Guid Id
    ) : IRequest;
}
