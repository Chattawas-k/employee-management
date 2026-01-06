using MediatR;

namespace employee_management.Application.Features.Employees.Queries.GetJobAssignmentList
{
    public sealed record GetJobAssignmentListRequest(
        string? Keyword = null
    ) : IRequest<List<GetJobAssignmentListResponse>>;
}

