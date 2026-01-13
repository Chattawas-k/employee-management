using MediatR;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository;
using employee_management.Application.Common.Services;
using employee_management.Application.Common.Exceptions;
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
        private readonly IEmployeeStatusHistoryWriter _historyWriter;
        private readonly IClientSourceProvider _clientSourceProvider;
        private readonly INotificationService _notificationService;
        private readonly IBusinessDateTimeProvider _dateTimeProvider;
        private readonly ILogger<UpdateMyQueueStatusHandler> _logger;

        public UpdateMyQueueStatusHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            IEmployeeStatusHistoryWriter historyWriter,
            IClientSourceProvider clientSourceProvider,
            INotificationService notificationService,
            IBusinessDateTimeProvider dateTimeProvider,
            ILogger<UpdateMyQueueStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _historyRepository = historyRepository;
            _historyWriter = historyWriter;
            _clientSourceProvider = clientSourceProvider;
            _notificationService = notificationService;
            _dateTimeProvider = dateTimeProvider;
            _logger = logger;
        }

        public async Task<UpdateMyQueueStatusResponse> Handle(UpdateMyQueueStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var today = _dateTimeProvider.GetBangkokTodayDate();
                
                // Get current queue to track previous status
                var currentQueue = await _queueRepository.GetByEmployeeIdAndDateAsync(request.EmployeeId, today, cancellationToken);
                var previousStatus = currentQueue?.AvailabilityStatus;

                // Disallow manual status changes while employee is Busy (serving customer)
                if (previousStatus == AvailabilityStatus.Busy && request.Status != AvailabilityStatus.Busy)
                {
                    throw new BadRequestException("ขณะนี้คุณติดลูกค้า ไม่สามารถเปลี่ยนสถานะได้จนกว่าจะปิดงาน");
                }

                // Update availability status (this will also update QueueStatus)
                // The method now returns the updated/created queue
                var queue = await _queueRepository.UpdateAvailabilityStatusAsync(request.EmployeeId, today, request.Status, cancellationToken);
                
                if (queue == null)
                {
                    _logger.LogError("UpdateAvailabilityStatusAsync returned null for EmployeeId: {EmployeeId}, Date: {Date}", request.EmployeeId, today);
                    throw new InvalidOperationException($"Failed to update or create queue for employee {request.EmployeeId} on {today:yyyy-MM-dd}");
                }

                await _historyWriter.TryWriteAsync(
                    employeeId: request.EmployeeId,
                    previousStatus: previousStatus,
                    newStatus: request.Status,
                    changeReason: ChangeReason.Manual,
                    changedBy: request.EmployeeId,
                    actorType: StatusActorType.Self,
                    source: _clientSourceProvider.GetSource(),
                    notes: null,
                    changedAt: DateTimeOffset.UtcNow,
                    cancellationToken: cancellationToken);

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

