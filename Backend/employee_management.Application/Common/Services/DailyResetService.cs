using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Common.Services
{
    public class DailyResetService : IDailyResetService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly IEmployeeStatusHistoryRepository _historyRepository;
        private readonly IEmployeeStatusHistoryWriter _historyWriter;
        private readonly ILogger<DailyResetService> _logger;

        public DailyResetService(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            IEmployeeStatusHistoryWriter historyWriter,
            ILogger<DailyResetService> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _historyRepository = historyRepository;
            _historyWriter = historyWriter;
            _logger = logger;
        }

        public async Task ResetDailyStatusAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var queues = await _queueRepository.GetByDateAsync(today, cancellationToken);
                
                int resetCount = 0;
                foreach (var queue in queues)
                {
                    // Only reset if not manually set to Break, Unavailable, or NotWorking
                    // Or reset all to Available as per requirement
                    if (queue.AvailabilityStatus != AvailabilityStatus.Available)
                    {
                        var previousStatus = queue.AvailabilityStatus;
                        
                        // Reset to Available
                        await _queueRepository.UpdateAvailabilityStatusAsync(queue.EmployeeId, today, AvailabilityStatus.Available, cancellationToken);
                        
                        await _historyWriter.TryWriteAsync(
                            employeeId: queue.EmployeeId,
                            previousStatus: previousStatus,
                            newStatus: AvailabilityStatus.Available,
                            changeReason: ChangeReason.Auto,
                            changedBy: null,
                            actorType: StatusActorType.System,
                            source: StatusChangeSource.Cron,
                            notes: "Daily reset to Available",
                            changedAt: DateTimeOffset.UtcNow,
                            cancellationToken: cancellationToken);
                        
                        resetCount++;
                    }
                }

                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation(
                    "Daily reset completed: {Count} employee status(es) reset to Available",
                    resetCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during daily reset");
                throw;
            }
        }
    }
}

