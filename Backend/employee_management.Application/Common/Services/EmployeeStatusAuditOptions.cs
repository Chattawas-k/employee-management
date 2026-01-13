namespace employee_management.Application.Common.Services
{
    public sealed class EmployeeStatusAuditOptions
    {
        public const string SectionName = "EmployeeStatusAudit";

        public int FrequentChangesThreshold { get; set; } = 10;
        public int LongBreakMinutesThreshold { get; set; } = 120;

        // Asia/Bangkok local time, e.g. "09:00"
        public string WorkdayStartTime { get; set; } = "09:00";
    }
}

