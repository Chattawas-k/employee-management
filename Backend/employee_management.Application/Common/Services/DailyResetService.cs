using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;
using employee_management.Application.Repository.EmployeesRepository;
using MediatR;
using employee_management.Application.Features.Queues.Commands.Archive;

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
        private readonly IMediator _mediator;
        private readonly ILogger<DailyResetService> _logger;

        public DailyResetService(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            IEmployeeRepository employeeRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            IEmployeeStatusHistoryWriter historyWriter,
            IBusinessDateTimeProvider dateTimeProvider,
            IMediator mediator,
            ILogger<DailyResetService> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _employeeRepository = employeeRepository;
            _historyRepository = historyRepository;
            _historyWriter = historyWriter;
            _dateTimeProvider = dateTimeProvider;
            _mediator = mediator;
            _logger = logger;
        }

        public async Task ResetDailyStatusAsync(CancellationToken cancellationToken = default)
        {
            var bangkokNow = _dateTimeProvider.GetBangkokNow();
            var today = _dateTimeProvider.GetBangkokTodayDate();
            var yesterday = today.AddDays(-1);
            var queueDateUtc = _dateTimeProvider.ToUtcKindDate(today);

            _logger.LogInformation(
                "Starting daily reset process at {BangkokTime} (Bangkok timezone)",
                bangkokNow.ToString("yyyy-MM-dd HH:mm:ss zzz"));
            _logger.LogInformation(
                "Date values - Today (Bangkok): {Today}, Yesterday: {Yesterday}, QueueDate (UTC): {QueueDateUtc}",
                today.ToString("yyyy-MM-dd"), yesterday.ToString("yyyy-MM-dd"), queueDateUtc.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"));

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

                // Validation: Check if there are any active employees
                if (employeesToQueue.Count == 0)
                {
                    _logger.LogWarning(
                        "⚠️ No active employees found! Cannot create queue entries for {Date}. " +
                        "Please ensure there are employees with Status=Active in the system.",
                        today.ToString("yyyy-MM-dd"));
                    throw new InvalidOperationException(
                        $"Cannot perform daily reset: No active employees found for {today:yyyy-MM-dd}. " +
                        "At least one employee with Status=Active is required.");
                }

                // Step 2: Archive yesterday's Master Queue (บันทึกประวัติคิวของวันก่อนหน้า)
                _logger.LogInformation("Step 2: Archiving yesterday's Master Queue for historical record...");
                try
                {
                    var archiveRequest = new ArchiveRequest(
                        SourceDate: yesterday,
                        TargetDate: yesterday // Archive to the same date (yesterday) for historical record
                    );
                    var archiveResponse = await _mediator.Send(archiveRequest, cancellationToken);
                    _logger.LogInformation(
                        "Archived {Count} queue entries from {SourceDate} for historical record",
                        archiveResponse.ArchivedCount, yesterday.ToString("yyyy-MM-dd"));
                }
                catch (Exception archiveEx)
                {
                    // Log warning but don't fail the entire reset if archive fails
                    _logger.LogWarning(archiveEx,
                        "Failed to archive yesterday's queue for {Date}, but continuing with reset. " +
                        "This is not critical - the reset will proceed.",
                        yesterday.ToString("yyyy-MM-dd"));
                }

                // Step 3: Get yesterday's queue order for rotation
                _logger.LogInformation("Step 3: Fetching yesterday's queue order for rotation...");
                _logger.LogInformation(
                    "Querying yesterday's queues with date: {YesterdayDate} (will be converted to UTC by GetByDateAsync)",
                    yesterday.ToString("yyyy-MM-dd"));
                var yesterdayQueues = await _queueRepository.GetByDateAsync(yesterday, cancellationToken);
                var yesterdayOrdered = yesterdayQueues
                    .Where(q => !q.IsDeleted)
                    .OrderBy(q => q.InitialPosition > 0 ? q.InitialPosition : q.Position)
                    .ToList();

                _logger.LogInformation("Found {Count} queue entries from yesterday", yesterdayOrdered.Count);

                // If no queues found for yesterday, try to get the latest Master Queue
                List<Queue> queuesToRotate = yesterdayOrdered;
                if (yesterdayOrdered.Count == 0)
                {
                    _logger.LogWarning(
                        "No queue found for yesterday ({YesterdayDate}). Searching for latest Master Queue...",
                        yesterday.ToString("yyyy-MM-dd"));
                    
                    var latestQueues = await _queueRepository.GetLatestMasterQueueAsync(yesterday, cancellationToken);
                    if (latestQueues.Count > 0)
                    {
                        _logger.LogInformation(
                            "Found latest Master Queue from {LatestDate} with {Count} entries. Will use this for rotation.",
                            latestQueues.First().QueueDate.ToString("yyyy-MM-dd"), latestQueues.Count);
                        queuesToRotate = latestQueues;
                    }
                    else
                    {
                        _logger.LogWarning(
                            "No previous Master Queue found. Will use default order based on CreatedDate.");
                    }
                }

                // Step 4: Build rotated Master Queue employee order
                // Rotation: Move first person to last, shift others up by 1 position
                _logger.LogInformation("Step 4: Building rotated queue order (first -> last, others shift up)...");
                var rotatedEmployeeIds = new List<Guid>();
                if (queuesToRotate.Count > 0)
                {
                    // Skip first person, add rest, then add first person at the end
                    rotatedEmployeeIds.AddRange(queuesToRotate.Skip(1).Select(q => q.EmployeeId));
                    rotatedEmployeeIds.Add(queuesToRotate[0].EmployeeId);

                    _logger.LogInformation(
                        "Rotated queue: First employee (Position {FirstPos}) moved to last. " +
                        "Total rotated: {Count}",
                        queuesToRotate[0].Position, rotatedEmployeeIds.Count);
                }
                else
                {
                    _logger.LogWarning("No previous queue found. Will use default order based on CreatedDate.");
                }

                // Step 5: Filter to only active employees and add any new employees
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

                // Validation: Ensure finalOrder is not empty (fallback to employeesToQueue if needed)
                if (finalOrder.Count == 0)
                {
                    _logger.LogWarning(
                        "⚠️ Final queue order is empty! Falling back to use all active employees in CreatedDate order.");
                    // Fallback: Use all active employees in CreatedDate order
                    finalOrder = employeesToQueue.Select(e => e.Id).ToList();
                    _logger.LogInformation(
                        "Fallback: Using {Count} active employees in CreatedDate order",
                        finalOrder.Count);
                }

                // Final validation: Ensure we have employees to queue
                if (finalOrder.Count == 0)
                {
                    _logger.LogError(
                        "❌ Cannot proceed: finalOrder is still empty after fallback. " +
                        "This should not happen if employeesToQueue.Count > 0.");
                    throw new InvalidOperationException(
                        "Cannot create queue entries: finalOrder is empty even after fallback.");
                }

                // Step 6: Delete existing queues for today (idempotent - allows re-running)
                _logger.LogInformation("Step 5: Cleaning up existing queues for today...");
                _logger.LogInformation(
                    "Querying existing queues for today with date: {TodayDate} (will be converted to UTC by GetByDateAsync)",
                    today.ToString("yyyy-MM-dd"));
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

                // Step 7: Create new queues for today with rotated order
                _logger.LogInformation("Step 6: Creating new queue entries for today...");
                _logger.LogInformation(
                    "Using QueueDate (UTC): {QueueDateUtc} for all new queue entries",
                    queueDateUtc.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"));

                var previousStatusByEmployee = queuesToRotate
                    .GroupBy(q => q.EmployeeId)
                    .ToDictionary(g => g.Key, g => g.First().AvailabilityStatus);

                var createdCount = 0;
                for (var i = 0; i < finalOrder.Count; i++)
                {
                    var employeeId = finalOrder[i];
                    var pos = i + 1;

                    var queue = new Queue
                    {
                        EmployeeId = employeeId,
                        Position = pos,
                        InitialPosition = pos,
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

                // Step 8: Save all changes
                _logger.LogInformation("Step 7: Saving all changes to database...");
                await _unitOfWork.Save(cancellationToken);
                _logger.LogInformation("Database save completed successfully");

                // Step 9: Verify that queues were actually created
                _logger.LogInformation("Step 8: Verifying queues were created successfully...");
                _logger.LogInformation(
                    "Querying database for queues with date: {Date} (will be converted to UTC range)",
                    today.ToString("yyyy-MM-dd"));
                
                var verifyQueues = await _queueRepository.GetByDateAsync(today, cancellationToken);
                var verifiedCount = verifyQueues.Count;

                if (verifiedCount == 0)
                {
                    _logger.LogError(
                        "❌ CRITICAL: Verification failed! No queues found in database for {Date}. " +
                        "Expected {ExpectedCount} queues. This indicates the save operation may have failed silently.",
                        today.ToString("yyyy-MM-dd"), createdCount);
                    throw new InvalidOperationException(
                        $"Queue creation verification failed: No queues found in database for {today:yyyy-MM-dd}. " +
                        $"Expected {createdCount} queues to be created.");
                }

                if (verifiedCount != createdCount)
                {
                    _logger.LogError(
                        "❌ Verification failed! Expected {ExpectedCount} queues but found {ActualCount} in database. " +
                        "This indicates a problem with the save operation. " +
                        "Some queues may not have been created or were deleted.",
                        createdCount, verifiedCount);
                    
                    // Log details about what was found
                    _logger.LogInformation(
                        "Found queues: {QueueDetails}",
                        string.Join(", ", verifyQueues.Select(q => 
                            $"EmployeeId={q.EmployeeId}, Position={q.Position}, QueueDate={q.QueueDate:yyyy-MM-dd HH:mm:ss}")));
                    
                    throw new InvalidOperationException(
                        $"Queue creation verification failed: Expected {createdCount} queues but found {verifiedCount}.");
                }

                _logger.LogInformation(
                    "✅ Verification passed: {VerifiedCount} queues confirmed in database for {Date}",
                    verifiedCount, today.ToString("yyyy-MM-dd"));
                
                // Log sample queue details for debugging
                if (verifiedCount > 0)
                {
                    var sampleQueue = verifyQueues.First();
                    _logger.LogInformation(
                        "Sample queue entry - EmployeeId: {EmployeeId}, Position: {Position}, " +
                        "QueueDate: {QueueDate}, Status: {Status}, AvailabilityStatus: {AvailabilityStatus}",
                        sampleQueue.EmployeeId, sampleQueue.Position,
                        sampleQueue.QueueDate.ToString("yyyy-MM-dd HH:mm:ss"),
                        sampleQueue.Status, sampleQueue.AvailabilityStatus);
                }

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

