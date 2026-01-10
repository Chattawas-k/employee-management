using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository.QueueRulesRepository;

namespace employee_management.Application.Features.Manager.Queries.Settings.GetQueueRules
{
    public sealed class GetQueueRulesHandler : IRequestHandler<GetQueueRulesRequest, GetQueueRulesResponse>
    {
        private readonly IQueueRuleRepository _queueRuleRepository;

        public GetQueueRulesHandler(IQueueRuleRepository queueRuleRepository)
        {
            _queueRuleRepository = queueRuleRepository;
        }

        public async Task<GetQueueRulesResponse> Handle(GetQueueRulesRequest request, CancellationToken cancellationToken)
        {
            var rule = await _queueRuleRepository.GetActiveRuleAsync(cancellationToken);
            if (rule == null)
            {
                // Return default values if no rule exists
                return new GetQueueRulesResponse(
                    Guid.Empty,
                    15, // Default SLA waiting minutes
                    30, // Default SLA assigned minutes
                    5,  // Default max concurrent
                    3,  // Default ready staff threshold
                    60, // Default busy time threshold
                    false
                );
            }

            return new GetQueueRulesResponse(
                rule.Id,
                rule.SlaWaitingMinutes,
                rule.SlaAssignedMinutes,
                rule.MaxConcurrentPerStaff,
                rule.ReadyStaffThreshold,
                rule.BusyTimeThresholdMinutes,
                rule.IsActive
            );
        }
    }
}
