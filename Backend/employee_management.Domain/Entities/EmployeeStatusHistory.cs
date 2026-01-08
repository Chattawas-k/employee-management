using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public class EmployeeStatusHistory : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public AvailabilityStatus? PreviousStatus { get; set; }
        public AvailabilityStatus NewStatus { get; set; }
        public ChangeReason ChangeReason { get; set; }
        public Guid? ChangedBy { get; set; }
        public Employee? ChangedByEmployee { get; set; }
        public DateTimeOffset ChangedDate { get; set; }
        public string? Notes { get; set; }
    }
}

