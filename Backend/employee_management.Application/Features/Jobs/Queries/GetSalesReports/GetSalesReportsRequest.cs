using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.GetSalesReports
{
    public sealed record GetSalesReportsRequest(
        Guid UserId, // UserId of the creator (not EmployeeId)
        string? Status = null // "success" | "failed" | "pending" | null (all)
    ) : IRequest<GetSalesReportsResponse>;
}


