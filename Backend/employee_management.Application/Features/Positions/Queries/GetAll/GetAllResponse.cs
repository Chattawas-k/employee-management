namespace employee_management.Application.Features.Positions.Queries.GetAll
{
    public sealed record GetAllPositionsResponse(
        Guid Id,
        string Name,
        string? Description,
        Guid DepartmentId,
        string? DepartmentName,
        bool IsActive
    );
}

