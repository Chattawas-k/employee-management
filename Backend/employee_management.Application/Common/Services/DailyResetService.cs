using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;
using employee_management.Application.Repository.EmployeesRepository;

namespace employee_management.Application.Common.Services
{
    public class DailyResetService : IDailyResetService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmployeeStatusHistoryRepository _historyRepository;
        private readonly IEmployeeStatusHistoryWriter _historyWriter;
        private readonly IBusinessDateTimeProvider _dateTimeProvider;
        private readonly ILogger<DailyResetService> _logger;

        public DailyResetService(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            IEmployeeRepository employeeRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            IEmployeeStatusHistoryWriter historyWriter,
            IBusinessDateTimeProvider dateTimeProvider,
            ILogger<DailyResetService> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _employeeRepository = employeeRepository;
            _historyRepository = historyRepository;
            _historyWriter = historyWriter;
            _dateTimeProvider = dateTimeProvider;
            _logger = logger;
        }

        public async Task ResetDailyStatusAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                // Business day (Asia/Bangkok) reset:
                // 1) Set everyone to "not ready" (Unavailable)
                // 2) Rotate Master Queue (yesterday head -> today tail)
                // 3) Set Round = 1 for all
                var today = _dateTimeProvider.GetBangkokTodayDate();
                var yesterday = today.AddDays(-1);

                var activeEmployees = await _employeeRepository.GetAll(cancellationToken);
                var employeesToQueue = activeEmployees
                    .Where(e => e.Status == EmployeeStatus.Active && !e.IsDeleted)
                    .OrderBy(e => e.CreatedDate)
                    .ToList();

                var yesterdayQueues = await _queueRepository.GetByDateAsync(yesterday, cancellationToken);
                var yesterdayOrdered = yesterdayQueues
                    .Where(q => !q.IsDeleted)
                    .OrderBy(q => q.Position)
                    .ToList();

                // Build rotated Master Queue employee order
                var rotatedEmployeeIds = new List<Guid>();
                if (yesterdayOrdered.Count > 0)
                {
                    rotatedEmployeeIds.AddRange(yesterdayOrdered.Skip(1).Select(q => q.EmployeeId));
                    rotatedEmployeeIds.Add(yesterdayOrdered[0].EmployeeId);
                }

                var activeEmployeeIds = new HashSet<Guid>(employeesToQueue.Select(e => e.Id));
                rotatedEmployeeIds = rotatedEmployeeIds.Where(activeEmployeeIds.Contains).ToList();

                var remainingEmployees = employeesToQueue
                    .Where(e => !rotatedEmployeeIds.Contains(e.Id))
                    .ToList();

                var finalOrder = new List<Guid>();
                finalOrder.AddRange(rotatedEmployeeIds);
                finalOrder.AddRange(remainingEmployees.Select(e => e.Id));

                // Delete existing queues for today (idempotent)
                var existingTodayQueues = await _queueRepository.GetByDateAsync(today, cancellationToken);
                foreach (var queue in existingTodayQueues)
                {
                    _queueRepository.Delete(queue);
                }

                // Create new queues for today
                var queueDateUtc = _dateTimeProvider.ToUtcKindDate(today);

                var previousStatusByEmployee = yesterdayOrdered
                    .GroupBy(q => q.EmployeeId)
                    .ToDictionary(g => g.Key, g => g.First().AvailabilityStatus);

                var createdCount = 0;
                for (var i = 0; i < finalOrder.Count; i++)
                {
                    var employeeId = finalOrder[i];

                    var queue = new Queue
                    {
                        EmployeeId = employeeId,
                        Position = i + 1,
                        Status = QueueStatus.Inactive,
                        AvailabilityStatus = AvailabilityStatus.Unavailable,
                        Round = 1,
                        QueueDate = queueDateUtc
                    };

                    _queueRepository.Create(queue);
                    createdCount++;

                    previousStatusByEmployee.TryGetValue(employeeId, out var previousStatus);
                    await _historyWriter.TryWriteAsync(
                        employeeId: employeeId,
                        previousStatus: previousStatus,
                        newStatus: AvailabilityStatus.Unavailable,
                        changeReason: ChangeReason.Auto,
                        changedBy: null,
                        actorType: StatusActorType.System,
                        source: StatusChangeSource.Cron,
                        notes: "Daily reset to Unavailable",
                        changedAt: DateTimeOffset.UtcNow,
                        cancellationToken: cancellationToken);
                }

                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation(
                    "Daily reset completed for {Date}: {Count} queue entries created, all set to Unavailable, Round=1",
                    today.ToString("yyyy-MM-dd"), createdCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during daily reset");
                throw;
            }
        }
    }
}

