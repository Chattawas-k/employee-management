namespace employee_management.Application.Features.Employees.Queries.GetJobAssignmentList
{
    public sealed record GetJobAssignmentListResponse(
        Guid Id,
        string Name,
        string Role,
        string? AvatarUrl,
        string Status,
        string StatusClass,
        int CurrentTasks,
        int QueuePosition
    );
}

