using MediatR;

namespace employee_management.Application.Features.ProductCategories.Queries.GetDropdownList
{
    public sealed record GetDropdownListRequest : IRequest<GetDropdownListResponse>;
}
