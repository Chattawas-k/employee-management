using MediatR;

namespace employee_management.Application.Features.Employees.Commands.Delete
{
    public sealed record DeleteRequest(Guid Id) : IRequest<Unit>;
}

