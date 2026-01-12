using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public class JobStatusHistory : BaseEntity
    {
        public Guid JobId { get; set; }
        public Job? Job { get; set; }

        public JobStatus? PreviousStatus { get; set; }
        public JobStatus NewStatus { get; set; }

        public JobChangeSource ChangeSource { get; set; }

        public Guid? ChangedByEmployeeId { get; set; }
        public Employee? ChangedByEmployee { get; set; }

        public DateTimeOffset ChangedDate { get; set; }

        public string? Notes { get; set; }

        // Assignment-specific metadata (optional)
        public Guid? PreviousAssigneeId { get; set; }
        public Guid? NewAssigneeId { get; set; }
    }
}

