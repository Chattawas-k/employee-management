using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository.WaitingJobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Commands.UpdateStatus
{
    public sealed class UpdateStatusHandler : IRequestHandler<UpdateStatusRequest, UpdateStatusResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IQueueRepository _queueRepository;
        private readonly IWaitingJobRepository _waitingJobRepository;
        private readonly IEmployeeStatusHistoryRepository _historyRepository;
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateStatusHandler> _logger;

        public UpdateStatusHandler(
            IUnitOfWork unitOfWork, 
            IJobRepository jobRepository, 
            IQueueRepository queueRepository,
            IWaitingJobRepository waitingJobRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            INotificationService notificationService,
            IMapper mapper, 
            ILogger<UpdateStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _queueRepository = queueRepository;
            _waitingJobRepository = waitingJobRepository;
            _historyRepository = historyRepository;
            _notificationService = notificationService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<UpdateStatusResponse> Handle(UpdateStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var job = await _jobRepository.Get(request.Id, cancellationToken);
                if (job == null)
                {
                    _logger.LogWarning("Job with Id: {JobId} not found for status update", request.Id);
                    throw new NoDataFoundException($"Job with Id {request.Id} not found.");
                }

                // Update status
                job.Status = request.Status;

                // Add status log entry
                var statusLogs = job.StatusLogs;
                statusLogs.Add(new StatusLog
                {
                    Status = request.Status.ToString(),
                    Timestamp = DateTimeOffset.UtcNow
                });
                job.StatusLogs = statusLogs;

                // Update report if provided
                if (request.Report != null)
                {
                    var report = _mapper.Map<JobReport>(request.Report);
                    job.Report = report;
                }

                // If rejected, store reject reason in description or create a special log entry
                if (request.Status == JobStatus.Rejected && !string.IsNullOrWhiteSpace(request.RejectReason))
                {
                    // Add reject reason to status log
                    statusLogs.Add(new StatusLog
                    {
                        Status = $"Rejected: {request.RejectReason}",
                        Timestamp = DateTimeOffset.UtcNow
                    });
                    job.StatusLogs = statusLogs;
                }

                _jobRepository.Update(job);
                await _unitOfWork.Save(cancellationToken);

                // Automatically update queue status based on job status
                await UpdateQueueStatusBasedOnJobStatus(job, cancellationToken);

                return _mapper.Map<UpdateStatusResponse>(job);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for job with Id: {JobId}", request.Id);
                throw;
            }
        }

        private async Task UpdateQueueStatusBasedOnJobStatus(Job job, CancellationToken cancellationToken)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var queue = await _queueRepository.GetByEmployeeIdAndDateAsync(job.AssigneeId, today, cancellationToken);
                
                if (queue == null)
                {
                    _logger.LogWarning("No queue entry found for employee {EmployeeId} on {Date}", job.AssigneeId, today);
                    return; // No queue entry exists, skip update
                }

                // Don't override manual status (break/unavailable)
                // If AvailabilityStatus is Break or Unavailable, it means employee manually set it
                // We should respect this manual setting and not override it automatically
                if (queue.AvailabilityStatus == AvailabilityStatus.Break || queue.AvailabilityStatus == AvailabilityStatus.Unavailable)
                {
                    _logger.LogInformation(
                        "AvailabilityStatus is {Status} (manual) for employee {EmployeeId}, skipping automatic status update for job {JobId}",
                        queue.AvailabilityStatus, job.AssigneeId, job.Id);
                    
                    // Still do rotation if job is starting (InProgress) to maintain queue order
                    // But don't change the status
                    if (job.Status == JobStatus.InProgress)
                    {
                        await _queueRepository.RotateQueueToTailAsync(job.AssigneeId, today, cancellationToken);
                        await _unitOfWork.Save(cancellationToken);
                        await _notificationService.SendQueueUpdatedNotificationAsync();
                        _logger.LogInformation(
                            "Rotated queue for employee {EmployeeId} but kept AvailabilityStatus as {Status} (manual) for job {JobId}",
                            job.AssigneeId, queue.AvailabilityStatus, job.Id);
                    }
                    return; // Don't override manual status
                }

                AvailabilityStatus? newAvailabilityStatus = null;
                var previousAvailabilityStatus = queue.AvailabilityStatus;

                if (job.Status == JobStatus.InProgress)
                {
                    // When job starts (InProgress):
                    // 1. Rotate queue: move staff to tail (Round-Robin) - MUST happen first
                    await _queueRepository.RotateQueueToTailAsync(job.AssigneeId, today, cancellationToken);
                    
                    // 2. Set availability status to Busy
                    newAvailabilityStatus = AvailabilityStatus.Busy;
                }
                else if (job.Status == JobStatus.Done)
                {
                    // When job is completed (Done), check if employee has other InProgress jobs
                    // Only set to Available if no other InProgress jobs exist
                    var employeeJobs = await _jobRepository.GetMyTasksAsync(job.AssigneeId, cancellationToken);
                    var hasOtherInProgressJobs = employeeJobs
                        .Any(j => j.Id != job.Id && j.Status == JobStatus.InProgress);

                    if (!hasOtherInProgressJobs)
                    {
                        // No other InProgress jobs, set to Available
                        // Note: Position stays at tail (already rotated when job was accepted)
                        newAvailabilityStatus = AvailabilityStatus.Available;
                    }
                    // If there are other InProgress jobs, keep status as Busy (don't change)
                }

                // Update availability status if needed
                if (newAvailabilityStatus.HasValue && queue.AvailabilityStatus != newAvailabilityStatus.Value)
                {
                    // Reload queue to get updated position after rotation
                    queue = await _queueRepository.GetByEmployeeIdAndDateAsync(job.AssigneeId, today, cancellationToken);
                    if (queue != null)
                    {
                        // Update availability status (this will also update QueueStatus)
                        await _queueRepository.UpdateAvailabilityStatusAsync(job.AssigneeId, today, newAvailabilityStatus.Value, cancellationToken);
                        
                        // Create history record (Auto change)
                        var history = new Domain.Entities.EmployeeStatusHistory
                        {
                            EmployeeId = job.AssigneeId,
                            PreviousStatus = previousAvailabilityStatus,
                            NewStatus = newAvailabilityStatus.Value,
                            ChangeReason = ChangeReason.Auto,
                            ChangedBy = null, // Auto change, no user
                            ChangedDate = DateTimeOffset.UtcNow,
                            Notes = $"Auto change due to job {job.JobNumber} status change to {job.Status}"
                        };
                        _historyRepository.Create(history);
                    }
                }
                
                // Save all changes (rotation + status update + history) in single transaction
                await _unitOfWork.Save(cancellationToken);

                // If staff became Available, try to assign waiting jobs
                if (newAvailabilityStatus == AvailabilityStatus.Available)
                {
                    await TryAssignWaitingJobsAsync(today, cancellationToken);
                }

                // Send SignalR notification for queue update
                await _notificationService.SendQueueUpdatedNotificationAsync();
                await _notificationService.SendEmployeeStatusChangedNotificationAsync();
                
                _logger.LogInformation(
                    "Updated availability status for employee {EmployeeId} from {PreviousStatus} to {NewStatus} based on job {JobId} status {JobStatus}",
                    job.AssigneeId, previousAvailabilityStatus, newAvailabilityStatus?.ToString() ?? "unchanged", job.Id, job.Status);
            }
            catch (Exception ex)
            {
                // Log but don't fail the job status update if queue update fails
                _logger.LogWarning(ex, "Failed to update queue status for job {JobId}", job.Id);
            }
        }

        private async Task TryAssignWaitingJobsAsync(DateTime date, CancellationToken cancellationToken)
        {
            try
            {
                var waitingJobs = await _waitingJobRepository.GetPendingWaitingJobsAsync(cancellationToken);
                
                if (!waitingJobs.Any())
                {
                    return; // No waiting jobs
                }

                foreach (var waitingJob in waitingJobs)
                {
                    // Get first available staff
                    var availableStaff = await _queueRepository.GetFirstAvailableStaffAsync(date, cancellationToken);
                    
                    if (availableStaff == null)
                    {
                        break; // No more available staff, stop assigning
                    }

                    // Get the job
                    var job = await _jobRepository.Get(waitingJob.JobId, cancellationToken);
                    if (job == null)
                    {
                        // Job doesn't exist, remove waiting job
                        _waitingJobRepository.Delete(waitingJob);
                        continue;
                    }

                    // Assign job to available staff
                    job.AssigneeId = availableStaff.EmployeeId;
                    _jobRepository.Update(job);

                    // Mark waiting job as assigned
                    waitingJob.AssignedDate = DateTime.UtcNow;
                    _waitingJobRepository.Update(waitingJob);

                    // Rotate queue: move assigned staff to tail
                    await _queueRepository.RotateQueueToTailAsync(availableStaff.EmployeeId, date, cancellationToken);

                    // Update queue status to Busy
                    var queue = await _queueRepository.GetByEmployeeIdAndDateAsync(availableStaff.EmployeeId, date, cancellationToken);
                    if (queue != null)
                    {
                        queue.Status = QueueStatus.Busy;
                        _queueRepository.Update(queue);
                    }

                    // Save changes
                    await _unitOfWork.Save(cancellationToken);

                    // Send notification
                    await _notificationService.SendJobAssignedNotificationAsync(
                        availableStaff.EmployeeId.ToString(),
                        job.Id.ToString(),
                        job.Title,
                        job.Customer);

                    _logger.LogInformation(
                        "Assigned waiting job {JobId} to employee {EmployeeId}",
                        job.Id, availableStaff.EmployeeId);
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the main operation
                _logger.LogWarning(ex, "Failed to assign waiting jobs");
            }
        }
    }
}

