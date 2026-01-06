using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Commands.UpdateStatus
{
    public sealed class UpdateStatusJobReportDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerContact { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty;
        public List<string> Reasons { get; set; } = new List<string>();
        public string ProductCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public sealed record UpdateStatusResponse(
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
        List<UpdateStatusLogDto> StatusLogs,
        UpdateStatusJobReportDto? Report
    );

    public sealed record UpdateStatusLogDto(
        string Status,
        DateTimeOffset Timestamp
    );
}

