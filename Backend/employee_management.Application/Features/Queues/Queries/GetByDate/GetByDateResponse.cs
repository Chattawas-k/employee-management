using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Queries.GetByDate
{
    public sealed record GetByDateResponse(
        Guid Id,
        Guid EmployeeId,
        string EmployeeName,
        string? PositionName,
        string? DepartmentName,
        int Position,
        QueueStatus Status,
        DateTime QueueDate
    );
}

