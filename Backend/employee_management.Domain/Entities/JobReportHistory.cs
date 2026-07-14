using employee_management.Domain.Common;

namespace employee_management.Domain.Entities
{
    /// <summary>
    /// Append-only history of edits made to a Job's sales report (Job.Report).
    /// One row per version: the original (IsOriginal=true) plus one row per edit.
    /// </summary>
    public class JobReportHistory : BaseEntity
    {
        public Guid JobId { get; set; }
        public Job? Job { get; set; }

        /// <summary>
        /// Full snapshot of the report state for this version, serialized as JSON.
        /// Shape mirrors <see cref="JobReportSnapshot"/>.
        /// </summary>
        public string SnapshotJson { get; set; } = "{}";

        /// <summary>
        /// Names of the fields that changed relative to the previous version, serialized as a JSON string array.
        /// Empty for the original version.
        /// </summary>
        public string ChangedFieldsJson { get; set; } = "[]";

        public Guid? EditedByEmployeeId { get; set; }
        public Employee? EditedByEmployee { get; set; }

        /// <summary>Denormalized editor name for display without an extra join.</summary>
        public string? EditedByName { get; set; }

        public DateTimeOffset EditedDate { get; set; }

        /// <summary>Optional free-text note describing why the edit was made.</summary>
        public string? EditNote { get; set; }

        /// <summary>True for the baseline snapshot captured before the first edit.</summary>
        public bool IsOriginal { get; set; }
    }

    /// <summary>
    /// Serialized payload stored in <see cref="JobReportHistory.SnapshotJson"/>.
    /// </summary>
    public class JobReportSnapshot
    {
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerContact { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty;
        public string JobStatus { get; set; } = string.Empty;
        public List<string> Reasons { get; set; } = new List<string>();
        public string ProductCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal? SaleValue { get; set; }
        public DateTimeOffset? SaleDate { get; set; }
    }
}
