using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Employees.Queries.Get
{
    public sealed record EmployeeGetResponse(
        Guid Id,
        string Name,
        string? Phone,
        EmployeeStatus Status,
        Guid PositionId,
        string? PositionName,
        string? DepartmentName,
        string? Avatar,
        DateTimeOffset CreatedDate
    );
}

