using MediatR;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.QueueRulesRepository;
using employee_management.Application.Repository.AuditLogsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Manager.Commands.Settings.UpdateQueueRules
{
    public sealed class UpdateQueueRulesHandler : IRequestHandler<UpdateQueueRulesRequest, UpdateQueueRulesResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRuleRepository _queueRuleRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<UpdateQueueRulesHandler> _logger;

        public UpdateQueueRulesHandler(
            IUnitOfWork unitOfWork,
            IQueueRuleRepository queueRuleRepository,
            IAuditLogRepository auditLogRepository,
            ICurrentUserService currentUserService,
            ILogger<UpdateQueueRulesHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRuleRepository = queueRuleRepository;
            _auditLogRepository = auditLogRepository;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<UpdateQueueRulesResponse> Handle(UpdateQueueRulesRequest request, CancellationToken cancellationToken)
        {
            // Get existing active rule or create new one
            var existingRule = await _queueRuleRepository.GetActiveRuleAsync(cancellationToken);
            
            QueueRule rule;
            string? beforeJson = null;

            if (existingRule != null)
            {
                // Deactivate old rule
                existingRule.IsActive = false;
                _queueRuleRepository.Update(existingRule);
                beforeJson = JsonSerializer.Serialize(existingRule);
            }

            // Create new active rule
            rule = new QueueRule
            {
                SlaWaitingMinutes = request.SlaWaitingMinutes,
                SlaAssignedMinutes = request.SlaAssignedMinutes,
                MaxConcurrentPerStaff = request.MaxConcurrentPerStaff,
                ReadyStaffThreshold = request.ReadyStaffThreshold,
                BusyTimeThresholdMinutes = request.BusyTimeThresholdMinutes,
                IsActive = true
            };

            _queueRuleRepository.Create(rule);

            // Create audit log
            var afterJson = JsonSerializer.Serialize(rule);
            var auditLog = new AuditLog
            {
                ActorId = _currentUserService.UserId ?? Guid.Empty,
                ActorName = _currentUserService.EmployeeId?.ToString() ?? "Manager",
                ActionType = AuditActionType.RuleChange,
                EntityType = "QueueRule",
                EntityId = rule.Id,
                BeforeJson = beforeJson,
                AfterJson = afterJson,
                Reason = "Queue rules updated by manager",
                Timestamp = DateTimeOffset.UtcNow
            };
            _auditLogRepository.Create(auditLog);

            await _unitOfWork.Save(cancellationToken);

            _logger.LogInformation(
                "Manager {ManagerId} updated queue rules. New rule Id: {RuleId}",
                _currentUserService.UserId, rule.Id);

            return new UpdateQueueRulesResponse(rule.Id, rule.IsActive);
        }
    }
}
