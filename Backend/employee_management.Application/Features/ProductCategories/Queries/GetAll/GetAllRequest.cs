using MediatR;

namespace employee_management.Application.Features.ProductCategories.Queries.GetAll
{
    public sealed record GetAllRequest : IRequest<GetAllResponse>;
}
