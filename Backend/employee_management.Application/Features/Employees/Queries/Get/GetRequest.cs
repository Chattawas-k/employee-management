using MediatR;

namespace employee_management.Application.Features.Employees.Queries.Get
{
    public sealed record GetRequest(Guid Id) : IRequest<GetResponse>;
}

