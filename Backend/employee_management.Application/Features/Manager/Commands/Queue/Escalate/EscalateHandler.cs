using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.AuditLogsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Manager.Commands.Queue.Escalate
{
    public sealed class EscalateHandler : IRequestHandler<EscalateRequest, EscalateResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<EscalateHandler> _logger;

        public EscalateHandler(
            IUnitOfWork unitOfWork,
            IJobRepository jobRepository,
            IAuditLogRepository auditLogRepository,
            ICurrentUserService currentUserService,
            ILogger<EscalateHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _auditLogRepository = auditLogRepository;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<EscalateResponse> Handle(EscalateRequest request, CancellationToken cancellationToken)
        {
            var job = await _jobRepository.Get(request.JobId, cancellationToken);
            if (job == null)
            {
                throw new NoDataFoundException($"Job with Id {request.JobId} not found.");
            }

            // Store before state for audit
            var beforeJson = JsonSerializer.Serialize(new { job.Priority, job.IsEscalated });

            // Escalate: set priority to Urgent and mark as escalated
            var previousPriority = job.Priority;
            job.Priority = JobPriority.Urgent;
            job.IsEscalated = true;

            // Add status log
            var statusLogs = job.StatusLogs;
            statusLogs.Add(new StatusLog
            {
                Status = $"Escalated by Manager: {request.Reason ?? "Priority escalation"}",
                Timestamp = DateTimeOffset.UtcNow
            });
            job.StatusLogs = statusLogs;

            _jobRepository.Update(job);

            // Create audit log
            var afterJson = JsonSerializer.Serialize(new { job.Priority, job.IsEscalated });
            var auditLog = new AuditLog
            {
                ActorId = _currentUserService.UserId ?? Guid.Empty,
                ActorName = _currentUserService.EmployeeId?.ToString() ?? "Manager",
                ActionType = AuditActionType.Escalate,
                EntityType = "Job",
                EntityId = job.Id,
                BeforeJson = beforeJson,
                AfterJson = afterJson,
                Reason = request.Reason,
                Timestamp = DateTimeOffset.UtcNow
            };
            _auditLogRepository.Create(auditLog);

            await _unitOfWork.Save(cancellationToken);

            _logger.LogInformation(
                "Manager {ManagerId} escalated job {JobId} from {PreviousPriority} to Urgent: {Reason}",
                _currentUserService.UserId, request.JobId, previousPriority, request.Reason);

            return new EscalateResponse(job.Id, job.IsEscalated, job.Priority);
        }
    }
}
