using MediatR;
using System;

namespace employee_management.Application.Features.TestTakers.Queries.Get
{
    public sealed record GetRequest(Guid Id) : IRequest<GetTestTakerResponse>;
}
