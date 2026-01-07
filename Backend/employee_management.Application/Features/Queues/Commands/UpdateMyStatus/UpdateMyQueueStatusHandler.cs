using MediatR;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Commands.UpdateMyStatus
{
    public sealed class UpdateMyQueueStatusHandler : IRequestHandler<UpdateMyQueueStatusRequest, UpdateMyQueueStatusResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly INotificationService _notificationService;
        private readonly ILogger<UpdateMyQueueStatusHandler> _logger;

        public UpdateMyQueueStatusHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            INotificationService notificationService,
            ILogger<UpdateMyQueueStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<UpdateMyQueueStatusResponse> Handle(UpdateMyQueueStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                await _queueRepository.UpdateQueueStatusAsync(request.EmployeeId, today, request.Status, cancellationToken);
                await _unitOfWork.Save(cancellationToken);

                // Get the updated queue
                var queue = await _queueRepository.GetByEmployeeIdAndDateAsync(request.EmployeeId, today, cancellationToken);
                if (queue == null)
                {
                    throw new InvalidOperationException("Queue not found after update");
                }

                // Send SignalR notification to update queue dashboard
                await _notificationService.SendQueueUpdatedNotificationAsync();

                return new UpdateMyQueueStatusResponse(
                    queue.Id,
                    queue.EmployeeId,
                    queue.Position,
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

