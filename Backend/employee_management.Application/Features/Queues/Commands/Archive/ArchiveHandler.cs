using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Commands.Archive
{
    public sealed class ArchiveHandler : IRequestHandler<ArchiveRequest, ArchiveResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly ILogger<ArchiveHandler> _logger;

        public ArchiveHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            ILogger<ArchiveHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _logger = logger;
        }

        public async Task<ArchiveResponse> Handle(ArchiveRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var targetDate = request.TargetDate ?? request.SourceDate;
                
                // Get queues from source date
                var sourceQueues = await _queueRepository.GetByDateAsync(request.SourceDate, cancellationToken);
                
                if (sourceQueues.Count == 0)
                {
                    _logger.LogWarning("No queues found for source date: {SourceDate}", request.SourceDate);
                    return new ArchiveResponse(0, request.SourceDate, targetDate);
                }

                // Check if target date already has queues
                var existingTargetQueues = await _queueRepository.GetByDateAsync(targetDate, cancellationToken);
                if (existingTargetQueues.Any())
                {
                    _logger.LogWarning("Target date {TargetDate} already has {Count} queues. Skipping archive.", 
                        targetDate, existingTargetQueues.Count);
                    // Optionally delete existing or skip - for now we'll skip
                    return new ArchiveResponse(0, request.SourceDate, targetDate);
                }

                // Create archived queues for target date
                // Ensure date is in UTC for PostgreSQL
                var targetDateUtc = targetDate.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(targetDate.Date, DateTimeKind.Utc)
                    : targetDate.Kind == DateTimeKind.Local 
                        ? targetDate.Date.ToUniversalTime()
                        : targetDate.Date;
                
                int archivedCount = 0;
                foreach (var sourceQueue in sourceQueues)
                {
                    var archivedQueue = new Queue
                    {
                        EmployeeId = sourceQueue.EmployeeId,
                        Position = sourceQueue.Position,
                        Status = sourceQueue.Status,
                        QueueDate = targetDateUtc,
                        CreatedDate = DateTimeOffset.UtcNow,
                        UpdatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    };
                    
                    _queueRepository.Create(archivedQueue);
                    archivedCount++;
                }

                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation("Archived {Count} queues from {SourceDate} to {TargetDate}", 
                    archivedCount, request.SourceDate, targetDate);
                
                return new ArchiveResponse(archivedCount, request.SourceDate, targetDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error archiving queues from {SourceDate}", request.SourceDate);
                throw;
            }
        }
    }
}

