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
            var today = _dateTimeProvider.GetBangkokTodayDate();
            var yesterday = today.AddDays(-1);

            _logger.LogInformation(
                "Starting daily reset process for {Date} (yesterday: {Yesterday})",
                today.ToString("yyyy-MM-dd"), yesterday.ToString("yyyy-MM-dd"));

            try
            {
                // Business day (Asia/Bangkok) reset:
                // 1) Set everyone to "not ready" (Unavailable)
                // 2) Rotate Master Queue (yesterday head -> today tail)
                // 3) Set Round = 1 for all
                // 4) Create new queue entries for today

                // Step 1: Get all active employees
                _logger.LogInformation("Step 1: Fetching active employees...");
                var activeEmployees = await _employeeRepository.GetAll(cancellationToken);
                var employeesToQueue = activeEmployees
                    .Where(e => e.Status == EmployeeStatus.Active && !e.IsDeleted)
                    .OrderBy(e => e.CreatedDate)
                    .ToList();

                _logger.LogInformation("Found {Count} active employees to queue", employeesToQueue.Count);

                // Step 2: Get yesterday's queue order for rotation
                _logger.LogInformation("Step 2: Fetching yesterday's queue order for rotation...");
                var yesterdayQueues = await _queueRepository.GetByDateAsync(yesterday, cancellationToken);
                var yesterdayOrdered = yesterdayQueues
                    .Where(q => !q.IsDeleted)
                    .OrderBy(q => q.Position)
                    .ToList();

                _logger.LogInformation("Found {Count} queue entries from yesterday", yesterdayOrdered.Count);

                // Step 3: Build rotated Master Queue employee order
                // Rotation: Move first person to last, shift others up by 1 position
                _logger.LogInformation("Step 3: Building rotated queue order (first -> last, others shift up)...");
                var rotatedEmployeeIds = new List<Guid>();
                if (yesterdayOrdered.Count > 0)
                {
                    // Skip first person, add rest, then add first person at the end
                    rotatedEmployeeIds.AddRange(yesterdayOrdered.Skip(1).Select(q => q.EmployeeId));
                    rotatedEmployeeIds.Add(yesterdayOrdered[0].EmployeeId);

                    _logger.LogInformation(
                        "Rotated queue: First employee from yesterday (Position {FirstPos}) moved to last. " +
                        "Total rotated: {Count}",
                        yesterdayOrdered[0].Position, rotatedEmployeeIds.Count);
                }
                else
                {
                    _logger.LogWarning("No previous queue found. Will use default order based on CreatedDate.");
                }

                // Step 4: Filter to only active employees and add any new employees
                var activeEmployeeIds = new HashSet<Guid>(employeesToQueue.Select(e => e.Id));
                rotatedEmployeeIds = rotatedEmployeeIds.Where(activeEmployeeIds.Contains).ToList();

                var remainingEmployees = employeesToQueue
                    .Where(e => !rotatedEmployeeIds.Contains(e.Id))
                    .ToList();

                var finalOrder = new List<Guid>();
                finalOrder.AddRange(rotatedEmployeeIds);
                finalOrder.AddRange(remainingEmployees.Select(e => e.Id));

                if (remainingEmployees.Count > 0)
                {
                    _logger.LogInformation(
                        "Added {Count} new employees (not in yesterday's queue) to the end",
                        remainingEmployees.Count);
                }

                _logger.LogInformation(
                    "Final queue order: {TotalCount} employees (rotated: {RotatedCount}, new: {NewCount})",
                    finalOrder.Count, rotatedEmployeeIds.Count, remainingEmployees.Count);

                // Step 5: Delete existing queues for today (idempotent - allows re-running)
                _logger.LogInformation("Step 4: Cleaning up existing queues for today...");
                var existingTodayQueues = await _queueRepository.GetByDateAsync(today, cancellationToken);
                var deletedCount = existingTodayQueues.Count;
                foreach (var queue in existingTodayQueues)
                {
                    _queueRepository.Delete(queue);
                }

                if (deletedCount > 0)
                {
                    _logger.LogInformation("Deleted {Count} existing queue entries for today", deletedCount);
                }

                // Step 6: Create new queues for today with rotated order
                _logger.LogInformation("Step 5: Creating new queue entries for today...");
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
                        AvailabilityStatus = AvailabilityStatus.Unavailable, // Set to "ไม่พร้อมรับงาน"
                        Round = 1, // Reset round to 1
                        QueueDate = queueDateUtc
                    };

                    _queueRepository.Create(queue);
                    createdCount++;

                    // Log status change history
                    previousStatusByEmployee.TryGetValue(employeeId, out var previousStatus);
                    try
                    {
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
                    catch (Exception historyEx)
                    {
                        // Log but don't fail the entire reset if history writing fails
                        _logger.LogWarning(historyEx,
                            "Failed to write status history for employee {EmployeeId}, but continuing reset",
                            employeeId);
                    }
                }

                _logger.LogInformation(
                    "Created {Count} new queue entries for today, all set to Unavailable status",
                    createdCount);

                // Step 7: Save all changes
                _logger.LogInformation("Step 6: Saving all changes to database...");
                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation(
                    "✅ Daily reset completed successfully for {Date}: " +
                    "{CreatedCount} queue entries created, {DeletedCount} deleted, " +
                    "all set to Unavailable, Round=1, queue rotated (first->last)",
                    today.ToString("yyyy-MM-dd"), createdCount, deletedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "❌ Error during daily reset for {Date}. " +
                    "Queue may be in inconsistent state. Manual intervention may be required.",
                    today.ToString("yyyy-MM-dd"));
                throw;
            }
        }
    }
}

