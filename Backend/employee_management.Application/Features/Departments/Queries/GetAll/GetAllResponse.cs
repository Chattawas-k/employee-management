namespace employee_management.Application.Features.Departments.Queries.GetAll
{
    public sealed record GetAllDepartmentsResponse(
        Guid Id,
        string Name,
        string? Description,
        bool IsActive
    );
}

