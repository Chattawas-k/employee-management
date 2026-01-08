using MediatR;

namespace employee_management.Application.Features.Queues.Commands.Delete
{
    public sealed record DeleteRequest(Guid Id) : IRequest<Unit>;
}

