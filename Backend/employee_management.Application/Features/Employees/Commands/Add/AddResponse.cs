using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Employees.Commands.Add
{
    public sealed record AddResponse(
        Guid Id,
        string Name,
        string? Phone,
        EmployeeStatus Status,
        Guid PositionId,
        string? Avatar,
        DateTimeOffset CreatedDate
    );
}

