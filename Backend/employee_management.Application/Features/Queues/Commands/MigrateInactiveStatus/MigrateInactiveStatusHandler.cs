using MediatR;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Commands.MigrateInactiveStatus
{
    public sealed class MigrateInactiveStatusHandler : IRequestHandler<MigrateInactiveStatusRequest, MigrateInactiveStatusResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly ILogger<MigrateInactiveStatusHandler> _logger;

        public MigrateInactiveStatusHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            ILogger<MigrateInactiveStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _logger = logger;
        }

        public async Task<MigrateInactiveStatusResponse> Handle(MigrateInactiveStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                if (request.TargetStatus != AvailabilityStatus.Break && request.TargetStatus != AvailabilityStatus.Unavailable)
                {
                    throw new ArgumentException("Target status must be Break or Unavailable", nameof(request.TargetStatus));
                }

                var today = DateTime.UtcNow.Date;
                var queues = await _queueRepository.GetByDateAsync(today, cancellationToken);
                
                // Find queues with Status = Inactive and AvailabilityStatus = Unavailable (default from migration)
                var inactiveQueues = queues.Where(q => q.Status == QueueStatus.Inactive && q.AvailabilityStatus == AvailabilityStatus.Unavailable).ToList();
                
                int migratedCount = 0;
                foreach (var queue in inactiveQueues)
                {
                    // Update availability status
                    await _queueRepository.UpdateAvailabilityStatusAsync(queue.EmployeeId, today, request.TargetStatus, cancellationToken);
                    migratedCount++;
                }

                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation(
                    "Migrated {Count} inactive queues to {TargetStatus}",
                    migratedCount, request.TargetStatus);

                return new MigrateInactiveStatusResponse(
                    migratedCount,
                    $"Successfully migrated {migratedCount} inactive status(es) to {request.TargetStatus}"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error migrating inactive status");
                throw;
            }
        }
    }
}

