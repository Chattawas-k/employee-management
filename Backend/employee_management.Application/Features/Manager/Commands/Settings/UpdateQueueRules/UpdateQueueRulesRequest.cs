using MediatR;

namespace employee_management.Application.Features.Manager.Commands.Settings.UpdateQueueRules
{
    public sealed record UpdateQueueRulesRequest(
        int SlaWaitingMinutes,
        int SlaAssignedMinutes,
        int MaxConcurrentPerStaff,
        int ReadyStaffThreshold,
        int BusyTimeThresholdMinutes
    ) : IRequest<UpdateQueueRulesResponse>;
}
