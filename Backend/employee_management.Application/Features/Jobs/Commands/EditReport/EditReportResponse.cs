using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Commands.EditReport
{
    public sealed record EditReportResponse(
        Guid Id,
        string JobNumber,
        string? JobRunningCode,
        JobStatus Status,
        EditReportResultDto Report,
        IReadOnlyList<string> ChangedFields
    );

    public sealed record EditReportResultDto(
        string CustomerName,
        string CustomerContact,
        string SalesStatus,
        List<string> Reasons,
        string ProductCategory,
        string Description,
        decimal? SaleValue,
        DateTimeOffset? SaleDate,
        string? ClosedByAdminName
    );
}
