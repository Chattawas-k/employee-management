using employee_management.Domain.Common;

namespace employee_management.Domain.Entities
{
    public class Position : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid DepartmentId { get; set; }
        public Department? Department { get; set; }
        public bool IsActive { get; set; } = true;
    }
}

