namespace employee_management.Application.Features.Manager.Queries.Settings.GetQueueRules
{
    public sealed record GetQueueRulesResponse(
        Guid Id,
        int SlaWaitingMinutes,
        int SlaAssignedMinutes,
        int MaxConcurrentPerStaff,
        int ReadyStaffThreshold,
        int BusyTimeThresholdMinutes,
        bool IsActive
    );
}
