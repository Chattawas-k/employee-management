using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.AuditLogsRepository;
using employee_management.Application.Repository.JobStatusHistoriesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Manager.Commands.Queue.ForceAssign
{
    public sealed class ForceAssignHandler : IRequestHandler<ForceAssignRequest, ForceAssignResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IJobStatusHistoryRepository _jobStatusHistoryRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<ForceAssignHandler> _logger;

        public ForceAssignHandler(
            IUnitOfWork unitOfWork,
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository,
            IAuditLogRepository auditLogRepository,
            IJobStatusHistoryRepository jobStatusHistoryRepository,
            ICurrentUserService currentUserService,
            ILogger<ForceAssignHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
            _auditLogRepository = auditLogRepository;
            _jobStatusHistoryRepository = jobStatusHistoryRepository;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<ForceAssignResponse> Handle(ForceAssignRequest request, CancellationToken cancellationToken)
        {
            var job = await _jobRepository.Get(request.JobId, cancellationToken);
            if (job == null)
            {
                throw new NoDataFoundException($"Job with Id {request.JobId} not found.");
            }

            var staff = await _employeeRepository.Get(request.StaffId, cancellationToken);
            if (staff == null)
            {
                throw new NoDataFoundException($"Employee with Id {request.StaffId} not found.");
            }

            // Store before state for audit
            var beforeJson = JsonSerializer.Serialize(new { job.AssigneeId, job.Status });

            // Update job
            var previousAssigneeId = job.AssigneeId;
            var previousStatus = job.Status;
            job.AssigneeId = request.StaffId;
            job.AssignedDate = DateTime.UtcNow;
            
            if (job.Status == JobStatus.Pending)
            {
                job.Status = JobStatus.Assigned;
            }

            // Add status log
            var statusLogs = job.StatusLogs;
            statusLogs.Add(new StatusLog
            {
                Status = $"Force Assigned to {staff.Name}",
                Timestamp = DateTimeOffset.UtcNow
            });
            job.StatusLogs = statusLogs;

            _jobRepository.Update(job);

            // Job history (Assigned)
            _jobStatusHistoryRepository.Create(new JobStatusHistory
            {
                JobId = job.Id,
                PreviousStatus = previousStatus,
                NewStatus = job.Status,
                ChangeSource = JobChangeSource.Assigned,
                ChangedByEmployeeId = _currentUserService.EmployeeId,
                ChangedDate = DateTimeOffset.UtcNow,
                PreviousAssigneeId = previousAssigneeId,
                NewAssigneeId = request.StaffId,
                Notes = string.IsNullOrWhiteSpace(request.Reason) ? "Force assigned" : $"Force assigned: {request.Reason}"
            });

            // Create audit log
            var afterJson = JsonSerializer.Serialize(new { job.AssigneeId, job.Status });
            var auditLog = new AuditLog
            {
                ActorId = _currentUserService.UserId ?? Guid.Empty,
                ActorName = _currentUserService.EmployeeId?.ToString() ?? "Manager",
                ActionType = AuditActionType.ForceAssign,
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
                "Manager {ManagerId} force assigned job {JobId} from {PreviousAssignee} to {NewAssignee}",
                _currentUserService.UserId, request.JobId, previousAssigneeId, request.StaffId);

            return new ForceAssignResponse(job.Id, request.StaffId, staff.Name);
        }
    }
}
