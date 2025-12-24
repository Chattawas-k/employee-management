using MediatR;
using System;

namespace employee_management.Application.Features.TestTakers.Commands.Delete
{
    public sealed record DeleteRequest(Guid Id) : IRequest<Unit>;
}
