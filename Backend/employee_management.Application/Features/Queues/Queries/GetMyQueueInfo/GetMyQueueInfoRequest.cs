using MediatR;

namespace employee_management.Application.Features.Queues.Queries.GetMyQueueInfo
{
    public record GetMyQueueInfoRequest(Guid EmployeeId) : IRequest<GetMyQueueInfoResponse>
    {
    }
}

