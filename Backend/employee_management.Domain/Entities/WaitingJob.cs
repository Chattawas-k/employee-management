using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public class WaitingJob : BaseEntity
    {
        public Guid JobId { get; set; }
        public Job? Job { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public JobPriority Priority { get; set; } = JobPriority.Normal;
        public DateTime? AssignedDate { get; set; } // When staff becomes available and job is assigned
    }
}

