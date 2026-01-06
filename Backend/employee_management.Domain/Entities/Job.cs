using employee_management.Domain.Common;
using employee_management.Domain.Enums;
using System.Text.Json;

namespace employee_management.Domain.Entities
{
    public class Job : BaseEntity
    {
        public string RunningNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid AssigneeId { get; set; }
        public Employee? Employee { get; set; }
        public JobStatus Status { get; set; } = JobStatus.Pending;
        public JobPriority Priority { get; set; } = JobPriority.Normal;
        
        // JSON columns
        private string _statusLogsJson = "[]";
        public string StatusLogsJson
        {
            get => _statusLogsJson;
            set => _statusLogsJson = value;
        }

        private string? _reportJson;
        public string? ReportJson
        {
            get => _reportJson;
            set => _reportJson = value;
        }

        // Helper properties for JSON serialization
        public List<StatusLog> StatusLogs
        {
            get
            {
                if (string.IsNullOrWhiteSpace(_statusLogsJson) || _statusLogsJson == "[]")
                    return new List<StatusLog>();
                try
                {
                    return JsonSerializer.Deserialize<List<StatusLog>>(_statusLogsJson) ?? new List<StatusLog>();
                }
                catch
                {
                    return new List<StatusLog>();
                }
            }
            set
            {
                _statusLogsJson = JsonSerializer.Serialize(value ?? new List<StatusLog>());
            }
        }

        public JobReport? Report
        {
            get
            {
                if (string.IsNullOrWhiteSpace(_reportJson))
                    return null;
                try
                {
                    return JsonSerializer.Deserialize<JobReport>(_reportJson);
                }
                catch
                {
                    return null;
                }
            }
            set
            {
                _reportJson = value == null ? null : JsonSerializer.Serialize(value);
            }
        }
    }

    public class StatusLog
    {
        public string Status { get; set; } = string.Empty;
        public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    }

    public class JobReport
    {
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerContact { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty; // "success" | "failed" | "pending"
        public List<string> Reasons { get; set; } = new List<string>();
        public string ProductCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}

