using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public class AuditLog : BaseEntity
    {
        public Guid ActorId { get; set; }
        public string ActorName { get; set; } = string.Empty;
        public AuditActionType ActionType { get; set; }
        public string EntityType { get; set; } = string.Empty; // "Job", "Employee", "QueueRule", etc.
        public Guid EntityId { get; set; }
        public string? BeforeJson { get; set; }
        public string? AfterJson { get; set; }
        public string? Reason { get; set; }
        public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
        public string? IpAddress { get; set; }
    }
}
