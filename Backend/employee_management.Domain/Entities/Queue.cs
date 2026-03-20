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
        /// The position assigned at queue creation time (start of day). Never changes during the day.
        /// Used by the daily reset to determine the correct head-to-tail rotation, because Position
        /// shifts throughout the day as jobs are assigned via RotateQueueToTailAsync.
        /// </summary>
        public int InitialPosition { get; set; }
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

