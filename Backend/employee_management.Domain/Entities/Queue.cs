using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public class Queue : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public int Position { get; set; }
        /// <summary>
        /// Number of jobs started (InProgress) by this employee for the given QueueDate.
        /// Used to compute fair runtime ordering: Round ASC, then Position ASC.
        /// </summary>
        public int Round { get; set; } = 1;
        public QueueStatus Status { get; set; } = QueueStatus.Active;
        public AvailabilityStatus AvailabilityStatus { get; set; } = AvailabilityStatus.Available;
        public DateTime QueueDate { get; set; } = DateTime.Today;
    }
}

