using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.Get
{
    public sealed record GetRequest(Guid Id) : IRequest<JobGetResponse>;
}

