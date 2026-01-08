namespace employee_management.Domain.Enums
{
    public enum ChangeReason
    {
        Auto = 1,    // เปลี่ยนโดยระบบ (job status change, daily reset)
        Manual = 2   // เปลี่ยนโดยพนักงาน
    }
}

