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

namespace employee_management.Application.Features.Manager.Commands.Queue.Cancel
{
    public sealed class CancelHandler : IRequestHandler<CancelRequest, CancelResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<CancelHandler> _logger;

        public CancelHandler(
            IUnitOfWork unitOfWork,
            IJobRepository jobRepository,
            IAuditLogRepository auditLogRepository,
            ICurrentUserService currentUserService,
            ILogger<CancelHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _auditLogRepository = auditLogRepository;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<CancelResponse> Handle(CancelRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new BadRequestException("Reason is required for cancellation.");
            }

            var job = await _jobRepository.Get(request.JobId, cancellationToken);
            if (job == null)
            {
                throw new NoDataFoundException($"Job with Id {request.JobId} not found.");
            }

            // Store before state for audit
            var beforeJson = JsonSerializer.Serialize(new { job.Status });

            // Cancel job
            var previousStatus = job.Status;
            job.Status = JobStatus.Cancelled;
            job.ClosedDate = DateTime.UtcNow;

            // Add status log
            var statusLogs = job.StatusLogs;
            statusLogs.Add(new StatusLog
            {
                Status = $"Cancelled by Manager: {request.Reason}",
                Timestamp = DateTimeOffset.UtcNow
            });
            job.StatusLogs = statusLogs;

            _jobRepository.Update(job);

            // Create audit log
            var afterJson = JsonSerializer.Serialize(new { job.Status });
            var auditLog = new AuditLog
            {
                ActorId = _currentUserService.UserId ?? Guid.Empty,
                ActorName = _currentUserService.EmployeeId?.ToString() ?? "Manager",
                ActionType = AuditActionType.Cancel,
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
                "Manager {ManagerId} cancelled job {JobId} from {PreviousStatus}: {Reason}",
                _currentUserService.UserId, request.JobId, previousStatus, request.Reason);

            return new CancelResponse(job.Id, job.Status);
        }
    }
}
