namespace employee_management.Domain.Enums
{
    public enum JobChangeSource
    {
        Auto = 1,     // System-driven (e.g., initial creation, automatic updates)
        Manual = 2,   // User manually updated status
        Assigned = 3  // Status/ownership changed due to assignment/transfer/force-assign
    }
}

