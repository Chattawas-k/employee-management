namespace employee_management.Application.Features.Jobs.Queries.GetReportHistory
{
    public sealed record GetReportHistoryResponse(
        List<ReportHistoryDto> Versions
    );

    public sealed record ReportHistoryDto(
        Guid Id,
        Guid JobId,
        int Version,
        bool IsOriginal,
        List<string> ChangedFields,
        Guid? EditedByEmployeeId,
        string? EditedByName,
        DateTimeOffset EditedDate,
        string? EditNote,
        ReportHistorySnapshotDto Snapshot
    );

    public sealed record ReportHistorySnapshotDto(
        string CustomerName,
        string CustomerContact,
        string SalesStatus,
        string JobStatus,
        List<string> Reasons,
        string ProductCategory,
        string Description,
        decimal? SaleValue,
        DateTimeOffset? SaleDate
    );
}
