using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.GetSalesReports
{
    public sealed record GetSalesReportsRequest(
        Guid EmployeeId, // EmployeeId of the assignee (not UserId)
        string? Status = null // "success" | "failed" | "pending" | null (all)
    ) : IRequest<GetSalesReportsResponse>;
}


