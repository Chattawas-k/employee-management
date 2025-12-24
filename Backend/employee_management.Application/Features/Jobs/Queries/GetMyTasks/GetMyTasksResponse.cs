using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Queries.GetMyTasks
{
    public sealed record GetMyTasksResponse(
        List<JobDto> Jobs
    );

    public sealed record JobDto(
        Guid Id,
        string Title,
        string Customer,
        string Description,
        Guid AssigneeId,
        string? AssigneeName,
        JobStatus Status,
        JobPriority Priority,
        DateTimeOffset CreatedDate,
        DateTimeOffset? UpdatedDate,
        List<MyTaskStatusLogDto> StatusLogs,
        MyTaskJobReportDto? Report
    );

    public sealed record MyTaskStatusLogDto(
        string Status,
        DateTimeOffset Timestamp
    );

    public sealed record MyTaskJobReportDto(
        string CustomerName,
        string CustomerContact,
        string SalesStatus,
        List<string> Reasons,
        string ProductCategory,
        string Description
    );
}

