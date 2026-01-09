namespace employee_management.Application.Features.Positions.Commands.Add
{
    public sealed record AddResponse(
        Guid Id,
        string Name,
        string? Description,
        Guid DepartmentId,
        string? DepartmentName,
        bool IsActive,
        DateTimeOffset CreatedDate
    );
}
