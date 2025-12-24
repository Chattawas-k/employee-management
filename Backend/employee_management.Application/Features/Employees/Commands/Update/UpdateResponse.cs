using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Employees.Commands.Update
{
    public sealed record UpdateResponse(
        Guid Id,
        string Name,
        string? Phone,
        EmployeeStatus Status,
        Guid PositionId,
        string? Avatar,
        DateTimeOffset UpdatedDate
    );
}

