using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.GetMyTasks
{
    public sealed record GetMyTasksRequest(Guid EmployeeId) : IRequest<GetMyTasksResponse>;
}

