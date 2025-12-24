using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Commands.UpdateStatus
{
    public sealed class UpdateStatusHandler : IRequestHandler<UpdateStatusRequest, UpdateStatusResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJobRepository _jobRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateStatusHandler> _logger;

        public UpdateStatusHandler(IUnitOfWork unitOfWork, IJobRepository jobRepository, IMapper mapper, ILogger<UpdateStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _jobRepository = jobRepository;
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
    }
}

