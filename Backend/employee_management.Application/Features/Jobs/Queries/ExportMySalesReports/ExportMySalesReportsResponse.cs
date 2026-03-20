using employee_management.Domain.Enums;
using System.Text.Json;

namespace employee_management.Application.Features.Jobs.Queries.ExportMySalesReports
{
    public sealed record ExportMySalesReportsResponse(
        List<ExportSalesReportRowDto> Rows,
        List<ExportStatusLogRowDto> StatusLogs
    );

    public sealed class ExportSalesReportRowDto
    {
        // Job
        public Guid JobId { get; set; }
        public string JobNumber { get; set; } = string.Empty;
        public string? JobRunningCode { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CustomerOriginal { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public JobPriority Priority { get; set; }
        public JobStatus JobStatus { get; set; }
        public bool IsEscalated { get; set; }
        public Guid? ProductCategoryId { get; set; }
        public string? ProductCategoryName { get; set; }
        public Guid AssigneeId { get; set; }
        public string? AssigneeName { get; set; }

        // Time (UTC in DTO; controller will convert to Bangkok)
        public DateTimeOffset CreatedAt { get; set; }
        public DateTime? AssignedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public DateTime? SlaWaitingBreachAt { get; set; }
        public DateTime? SlaAssignedBreachAt { get; set; }
        public DateTimeOffset? SaleDateDerived { get; set; }

        // Sales report
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerContact { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty; // success/failed/pending/rejected/empty
        public List<string> Reasons { get; set; } = new();
        public string ProductCategoryReport { get; set; } = string.Empty;
        public string DescriptionReport { get; set; } = string.Empty;

        // Extra columns requested
        public string? ClosedByAdminName { get; set; }
        public decimal? SaleValueDerived { get; set; }

        // Audit/debug
        public string StatusLogsSummary { get; set; } = string.Empty;
        public string? ReportJsonRaw { get; set; }
    }

    public sealed class ExportStatusLogRowDto
    {
        public Guid JobId { get; set; }
        public string JobNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTimeOffset Timestamp { get; set; }
    }
}

