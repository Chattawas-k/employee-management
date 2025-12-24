namespace employee_management.Application.Features.Employees.Queries.DropdownList
{
    public sealed record DropdownListResponse(
        Guid Id,
        string Name,
        string? PositionName,
        string? DepartmentName
    );
}

