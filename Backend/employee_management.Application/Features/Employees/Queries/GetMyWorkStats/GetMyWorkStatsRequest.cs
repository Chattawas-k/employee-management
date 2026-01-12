using MediatR;

namespace employee_management.Application.Features.Employees.Queries.GetMyWorkStats
{
    public sealed record GetMyWorkStatsRequest(
        Guid EmployeeId,
        DateTime? StartDate,
        DateTime? EndDate
    ) : IRequest<GetMyWorkStatsResponse>;
}
