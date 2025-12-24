using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public class Queue : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public int Position { get; set; }
        public QueueStatus Status { get; set; } = QueueStatus.Active;
        public DateTime QueueDate { get; set; } = DateTime.Today;
    }
}

