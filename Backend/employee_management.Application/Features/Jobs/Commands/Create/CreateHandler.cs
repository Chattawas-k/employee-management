using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobsRepository;
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
        private readonly IMapper _mapper;
        private readonly ILogger<CreateHandler> _logger;
        private readonly INotificationService _notificationService;

        public CreateHandler(
            IUnitOfWork unitOfWork,
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository,
            IMapper mapper,
            ILogger<CreateHandler> logger,
            INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<CreateResponse> Handle(CreateRequest request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate that the assignee exists
                var employee = await _employeeRepository.Get(request.AssigneeId, cancellationToken);
                if (employee == null)
                {
                    _logger.LogWarning("Employee with Id: {EmployeeId} not found", request.AssigneeId);
                    throw new NoDataFoundException($"Employee with Id {request.AssigneeId} not found.");
                }

                // Generate running number for today
                var today = DateTime.UtcNow.Date;
                var runningNumber = await _jobRepository.GetNextRunningNumberAsync(today, cancellationToken);

                // Create new Job entity
                var job = new Job
                {
                    RunningNumber = runningNumber,
                    Title = request.Title,
                    Customer = request.Customer,
                    Description = request.Description,
                    AssigneeId = request.AssigneeId,
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

