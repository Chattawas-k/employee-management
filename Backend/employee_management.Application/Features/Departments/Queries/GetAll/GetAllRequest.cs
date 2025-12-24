using MediatR;

namespace employee_management.Application.Features.Departments.Queries.GetAll
{
    public sealed record GetAllRequest() : IRequest<List<GetAllDepartmentsResponse>>;
}

