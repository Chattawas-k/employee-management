using MediatR;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository;
using employee_management.Application.Common.Services;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Commands.UpdateMyStatus
{
    public sealed class UpdateMyQueueStatusHandler : IRequestHandler<UpdateMyQueueStatusRequest, UpdateMyQueueStatusResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly IEmployeeStatusHistoryRepository _historyRepository;
        private readonly INotificationService _notificationService;
        private readonly ILogger<UpdateMyQueueStatusHandler> _logger;

        public UpdateMyQueueStatusHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            INotificationService notificationService,
            ILogger<UpdateMyQueueStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _historyRepository = historyRepository;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<UpdateMyQueueStatusResponse> Handle(UpdateMyQueueStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                
                // Get current queue to track previous status
                var currentQueue = await _queueRepository.GetByEmployeeIdAndDateAsync(request.EmployeeId, today, cancellationToken);
                var previousStatus = currentQueue?.AvailabilityStatus;

                // Update availability status (this will also update QueueStatus)
                await _queueRepository.UpdateAvailabilityStatusAsync(request.EmployeeId, today, request.Status, cancellationToken);
                
                // Get the updated queue
                var queue = await _queueRepository.GetByEmployeeIdAndDateAsync(request.EmployeeId, today, cancellationToken);
                if (queue == null)
                {
                    throw new InvalidOperationException("Queue not found after update");
                }

                // Create history record (Manual change)
                var history = new Domain.Entities.EmployeeStatusHistory
                {
                    EmployeeId = request.EmployeeId,
                    PreviousStatus = previousStatus,
                    NewStatus = request.Status,
                    ChangeReason = ChangeReason.Manual,
                    ChangedBy = request.EmployeeId, // Employee changed their own status
                    ChangedDate = DateTimeOffset.UtcNow
                };
                _historyRepository.Create(history);

                await _unitOfWork.Save(cancellationToken);

                // Send SignalR notifications to update queue dashboard and employee status
                await _notificationService.SendQueueUpdatedNotificationAsync();
                await _notificationService.SendEmployeeStatusChangedNotificationAsync();

                _logger.LogInformation(
                    "Updated availability status for employee {EmployeeId} from {PreviousStatus} to {NewStatus}",
                    request.EmployeeId, previousStatus?.ToString() ?? "null", request.Status);

                return new UpdateMyQueueStatusResponse(
                    queue.Id,
                    queue.EmployeeId,
                    queue.Position,
                    queue.AvailabilityStatus,
                    queue.Status,
                    queue.UpdatedDate
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating queue status for EmployeeId: {EmployeeId}", request.EmployeeId);
                throw;
            }
        }
    }
}

