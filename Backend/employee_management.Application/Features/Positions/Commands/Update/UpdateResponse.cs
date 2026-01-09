namespace employee_management.Application.Features.Positions.Commands.Update
{
    public sealed record UpdateResponse(
        Guid Id,
        string Name,
        string? Description,
        Guid DepartmentId,
        string? DepartmentName,
        bool IsActive,
        DateTimeOffset CreatedDate,
        DateTimeOffset? UpdatedDate
    );
}
