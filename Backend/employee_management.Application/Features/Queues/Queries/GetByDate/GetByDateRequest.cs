using MediatR;

namespace employee_management.Application.Features.Queues.Queries.GetByDate
{
    public sealed record GetByDateRequest(DateTime Date) : IRequest<List<GetByDateResponse>>;
}

