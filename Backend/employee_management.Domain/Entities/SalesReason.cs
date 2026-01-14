using employee_management.Domain.Common;
using employee_management.Domain.Enums;

namespace employee_management.Domain.Entities
{
    public sealed class SalesReason : BaseEntity
    {
        public SalesReasonType Type { get; set; }
        public string Label { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }
}

