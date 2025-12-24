using MediatR;

namespace employee_management.Application.Features.Positions.Queries.GetAll
{
    public sealed record GetAllRequest(Guid? DepartmentId = null) : IRequest<List<GetAllPositionsResponse>>;
}

