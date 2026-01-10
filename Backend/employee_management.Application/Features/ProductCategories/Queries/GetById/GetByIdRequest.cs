using MediatR;

namespace employee_management.Application.Features.ProductCategories.Queries.GetById
{
    public sealed record GetByIdRequest(
        Guid Id
    ) : IRequest<GetByIdResponse>;
}
