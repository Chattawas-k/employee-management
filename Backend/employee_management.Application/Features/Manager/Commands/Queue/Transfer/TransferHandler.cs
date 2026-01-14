using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.AuditLogsRepository;
using employee_management.Application.Repository.JobStatusHistoriesRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Manager.Commands.Queue.Transfer
{
    public sealed class TransferHandler : IRequestHandler<TransferRequest, TransferResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IQueueRepository _queueRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IJobStatusHistoryRepository _jobStatusHistoryRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IBusinessDateTimeProvider _dateTimeProvider;
        private readonly INotificationService _notificationService;
        private readonly ILogger<TransferHandler> _logger;

        public TransferHandler(
            IUnitOfWork unitOfWork,
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository,
            IQueueRepository queueRepository,
            IAuditLogRepository auditLogRepository,
            IJobStatusHistoryRepository jobStatusHistoryRepository,
            ICurrentUserService currentUserService,
            IBusinessDateTimeProvider dateTimeProvider,
            INotificationService notificationService,
            ILogger<TransferHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
            _queueRepository = queueRepository;
            _auditLogRepository = auditLogRepository;
            _jobStatusHistoryRepository = jobStatusHistoryRepository;
            _currentUserService = currentUserService;
            _dateTimeProvider = dateTimeProvider;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<TransferResponse> Handle(TransferRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new BadRequestException("Reason is required for transfer.");
            }

            var job = await _jobRepository.Get(request.JobId, cancellationToken);
            if (job == null)
            {
                throw new NoDataFoundException($"Job with Id {request.JobId} not found.");
            }

            var toStaff = await _employeeRepository.Get(request.ToStaffId, cancellationToken);
            if (toStaff == null)
            {
                throw new NoDataFoundException($"Employee with Id {request.ToStaffId} not found.");
            }

            // Store before state for audit
            var beforeJson = JsonSerializer.Serialize(new { job.AssigneeId, job.Status });

            // Update job
            var fromStaffId = job.AssigneeId;
            var previousStatus = job.Status;
            job.AssigneeId = request.ToStaffId;
            job.AssignedDate = DateTime.UtcNow;

            // Add status log
            var statusLogs = job.StatusLogs;
            statusLogs.Add(new StatusLog
            {
                Status = $"Transferred from {job.Employee?.Name} to {toStaff.Name}: {request.Reason}",
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
                PreviousAssigneeId = fromStaffId,
                NewAssigneeId = request.ToStaffId,
                Notes = $"Transferred: {request.Reason}"
            });

            // Create audit log
            var afterJson = JsonSerializer.Serialize(new { job.AssigneeId, job.Status });
            var auditLog = new AuditLog
            {
                ActorId = _currentUserService.UserId ?? Guid.Empty,
                ActorName = _currentUserService.EmployeeId?.ToString() ?? "Manager",
                ActionType = AuditActionType.Transfer,
                EntityType = "Job",
                EntityId = job.Id,
                BeforeJson = beforeJson,
                AfterJson = afterJson,
                Reason = request.Reason,
                Timestamp = DateTimeOffset.UtcNow
            };
            _auditLogRepository.Create(auditLog);

            var businessToday = _dateTimeProvider.GetBangkokTodayDate();

            // Queue effects on assignment to new staff:
            // - Make assignee non-READY immediately (Busy)
            // - Increment Round exactly once per assignment
            await _queueRepository.UpdateAvailabilityStatusAsync(request.ToStaffId, businessToday, AvailabilityStatus.Busy, cancellationToken);
            await _queueRepository.IncrementRoundAsync(request.ToStaffId, businessToday, cancellationToken);

            // Best-effort: if old staff was Busy only due to this job and has no other open jobs,
            // allow them to become Available again (do not override manual statuses).
            if (fromStaffId != Guid.Empty)
            {
                var fromQueue = await _queueRepository.GetByEmployeeIdAndDateAsync(fromStaffId, businessToday, cancellationToken);
                if (fromQueue != null && fromQueue.AvailabilityStatus == AvailabilityStatus.Busy)
                {
                    var fromJobs = await _jobRepository.GetMyTasksAsync(fromStaffId, cancellationToken);
                    var hasOtherOpenJobs = fromJobs.Any(j => j.Status == JobStatus.Assigned || j.Status == JobStatus.InProgress);
                    if (!hasOtherOpenJobs)
                    {
                        await _queueRepository.UpdateAvailabilityStatusAsync(fromStaffId, businessToday, AvailabilityStatus.Available, cancellationToken);
                    }
                }
            }

            await _unitOfWork.Save(cancellationToken);

            await _notificationService.SendQueueUpdatedNotificationAsync();
            await _notificationService.SendEmployeeStatusChangedNotificationAsync(
                request.ToStaffId.ToString(),
                "busy"
            );
            if (fromStaffId != Guid.Empty)
            {
                await _notificationService.SendEmployeeStatusChangedNotificationAsync(
                    fromStaffId.ToString(),
                    "available"
                );
            }

            _logger.LogInformation(
                "Manager {ManagerId} transferred job {JobId} from {FromStaff} to {ToStaff}: {Reason}",
                _currentUserService.UserId, request.JobId, fromStaffId, request.ToStaffId, request.Reason);

            return new TransferResponse(job.Id, fromStaffId, request.ToStaffId, toStaff.Name);
        }
    }
}
