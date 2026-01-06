using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Queries.Get
{
    public sealed record JobGetResponse(
        Guid Id,
        string RunningNumber,
        string Title,
        string Customer,
        string Description,
        Guid AssigneeId,
        string? AssigneeName,
        JobStatus Status,
        JobPriority Priority,
        DateTimeOffset CreatedDate,
        DateTimeOffset? UpdatedDate,
        List<JobStatusLogDto> StatusLogs,
        JobFullReportDto? Report
    );

    public sealed record JobStatusLogDto(
        string Status,
        DateTimeOffset Timestamp
    );

    public sealed record JobFullReportDto(
        string CustomerName,
        string CustomerContact,
        string SalesStatus,
        List<string> Reasons,
        string ProductCategory,
        string Description
    );
}

