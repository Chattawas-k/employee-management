using employee_management.Domain.Common;

namespace employee_management.Domain.Entities
{
    public class QueueRule : BaseEntity
    {
        public int SlaWaitingMinutes { get; set; } = 15; // Default 15 minutes
        public int SlaAssignedMinutes { get; set; } = 30; // Default 30 minutes
        public int MaxConcurrentPerStaff { get; set; } = 5; // Default 5 concurrent jobs
        public int ReadyStaffThreshold { get; set; } = 3; // Alert if ready staff < 3
        public int BusyTimeThresholdMinutes { get; set; } = 60; // Alert if busy > 60 minutes
        public bool IsActive { get; set; } = true;
    }
}
