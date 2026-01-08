using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository.WaitingJobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Commands.Create
{
    public sealed class CreateHandler : IRequestHandler<CreateRequest, CreateResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IQueueRepository _queueRepository;
        private readonly IWaitingJobRepository _waitingJobRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateHandler> _logger;
        private readonly INotificationService _notificationService;
        private readonly IJobNumberService _jobNumberService;

        public CreateHandler(
            IUnitOfWork unitOfWork,
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository,
            IQueueRepository queueRepository,
            IWaitingJobRepository waitingJobRepository,
            IMapper mapper,
            ILogger<CreateHandler> logger,
            INotificationService notificationService,
            IJobNumberService jobNumberService)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
            _queueRepository = queueRepository;
            _waitingJobRepository = waitingJobRepository;
            _mapper = mapper;
            _logger = logger;
            _notificationService = notificationService;
            _jobNumberService = jobNumberService;
        }

        public async Task<CreateResponse> Handle(CreateRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var assigneeId = request.AssigneeId;

                // Generate job number for today
                var today = DateTime.UtcNow;
                var jobNumber = await _jobNumberService.GenerateJobNumberAsync(today, cancellationToken);

                // Create new Job entity (without assignee initially if auto-assigning)
                var job = new Job
                {
                    JobNumber = jobNumber,
                    Title = request.Title,
                    Customer = request.Customer,
                    Description = request.Description,
                    AssigneeId = assigneeId, // May be Guid.Empty if auto-assigning
                    Status = JobStatus.Pending,
                    Priority = request.Priority,
                    StatusLogs = new List<StatusLog>
                    {
                        new StatusLog
                        {
                            Status = JobStatus.Pending.ToString(),
                            Timestamp = DateTimeOffset.UtcNow
                        }
                    }
                };

                _jobRepository.Create(job);
                await _unitOfWork.Save(cancellationToken);

                // Auto-assign to first Available staff if AssigneeId is not provided (Guid.Empty)
                if (assigneeId == Guid.Empty)
                {
                    var todayDate = today.Date;
                    var firstAvailableQueue = await _queueRepository.GetFirstAvailableStaffAsync(todayDate, cancellationToken);
                    
                    if (firstAvailableQueue == null)
                    {
                        // No available staff - create WaitingJob
                        _logger.LogWarning("No available staff found for auto-assignment, creating waiting job for JobId: {JobId}", job.Id);
                        
                        var waitingJob = new WaitingJob
                        {
                            JobId = job.Id,
                            CustomerName = request.Customer,
                            Title = request.Title,
                            Priority = request.Priority
                        };
                        
                        _waitingJobRepository.Create(waitingJob);
                        await _unitOfWork.Save(cancellationToken);
                        
                        // Send notification about waiting job
                        await _notificationService.SendQueueUpdatedNotificationAsync();
                        
                        // Return response indicating job is waiting
                        var waitingJobEntity = await _jobRepository.Get(job.Id, cancellationToken);
                        if (waitingJobEntity == null)
                        {
                            throw new Exception("Failed to retrieve created job.");
                        }
                        
                        return _mapper.Map<CreateResponse>(waitingJobEntity);
                    }

                    // Assign to first available staff
                    assigneeId = firstAvailableQueue.EmployeeId;
                    
                    // Update job with assignee
                    job.AssigneeId = assigneeId;
                    _jobRepository.Update(job);
                    await _unitOfWork.Save(cancellationToken);
                    
                    _logger.LogInformation("Auto-assigned job to employee {EmployeeId} (position {Position})", 
                        assigneeId, firstAvailableQueue.Position);
                }
                else
                {
                    // Validate that the assignee exists (if manually assigned)
                    var employee = await _employeeRepository.Get(assigneeId, cancellationToken);
                    if (employee == null)
                    {
                        _logger.LogWarning("Employee with Id: {EmployeeId} not found", assigneeId);
                        throw new NoDataFoundException($"Employee with Id {assigneeId} not found.");
                    }
                }

                // Reload the job with employee relationship for mapping
                var createdJob = await _jobRepository.Get(job.Id, cancellationToken);
                if (createdJob == null)
                {
                    _logger.LogError("Failed to retrieve created job with Id: {JobId}", job.Id);
                    throw new Exception("Failed to retrieve created job.");
                }

                // ส่ง notification ไปยัง employee ที่ถูก assign งาน
                try
                {
                    await _notificationService.SendJobAssignedNotificationAsync(
                        createdJob.AssigneeId.ToString(),
                        createdJob.Id.ToString(),
                        createdJob.Title,
                        createdJob.Customer
                    );
                }
                catch (Exception notifEx)
                {
                    // Log but don't fail the request if notification fails
                    _logger.LogWarning(notifEx, "Failed to send notification for Job: {JobId}", createdJob.Id);
                }

                return _mapper.Map<CreateResponse>(createdJob);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating job with Title: {Title}", request.Title);
                throw;
            }
        }
    }
}

