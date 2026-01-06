using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Commands.Create
{
    public sealed record CreateResponse(
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
        List<CreateStatusLogDto> StatusLogs,
        CreateJobReportDto? Report
    );

    public sealed record CreateStatusLogDto(
        string Status,
        DateTimeOffset Timestamp
    );

    public sealed class CreateJobReportDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerContact { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty;
        public List<string> Reasons { get; set; } = new List<string>();
        public string ProductCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}

