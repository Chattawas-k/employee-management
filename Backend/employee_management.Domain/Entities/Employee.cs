using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public class Employee : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
        public Guid PositionId { get; set; }
        public Position? Position { get; set; }
        public string? Avatar { get; set; }
    }
}

