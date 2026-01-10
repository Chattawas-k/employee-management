namespace employee_management.Domain.Enums
{
    public enum JobStatus
    {
        Pending = 1,        // WAITING
        Assigned = 2,        // ASSIGNED (between Pending and InProgress)
        InProgress = 3,      // IN_PROGRESS
        ClosedWon = 4,       // CLOSED_WON (replaces Done for successful sales)
        ClosedLost = 5,      // CLOSED_LOST (replaces Done for failed sales)
        Cancelled = 6        // CANCELLED (replaces Rejected)
    }
}

