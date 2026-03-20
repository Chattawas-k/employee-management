using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Repository.AuditLogsRepository;
using employee_management.Application.Common.Services;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Commands.BulkUpdate
{
    public sealed class BulkUpdateHandler : IRequestHandler<BulkUpdateRequest, BulkUpdateResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<BulkUpdateHandler> _logger;

        public BulkUpdateHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            IAuditLogRepository auditLogRepository,
            ICurrentUserService currentUserService,
            ILogger<BulkUpdateHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _auditLogRepository = auditLogRepository;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<BulkUpdateResponse> Handle(BulkUpdateRequest request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation(
                    "Admin override: Starting queue bulk update by user {UserId} (EmployeeId: {EmployeeId}), UpdateMaster={UpdateMaster}",
                    _currentUserService.UserId, _currentUserService.EmployeeId, request.UpdateMaster);

                int updatedCount = 0;
                int deletedCount = 0;
                var notFoundIds = new List<Guid>();

                // Capture before/after for audit (Master Queue reorder)
                var queuesForAudit = new List<(Guid QueueId, Guid EmployeeId, DateTime QueueDate, int BeforePosition, int? AfterPosition, int Round)>();

                foreach (var queueItem in request.Queues)
                {
                    var queue = await _queueRepository.Get(queueItem.Id, cancellationToken);
                    if (queue == null)
                    {
                        notFoundIds.Add(queueItem.Id);
                        _logger.LogWarning("Queue with Id: {QueueId} not found for bulk update", queueItem.Id);
                        continue;
                    }

                    // IMPORTANT: Round is NOT reset during admin override - preserve current Round value
                    var currentRound = queue.Round;
                    
                    queuesForAudit.Add((
                        QueueId: queue.Id,
                        EmployeeId: queue.EmployeeId,
                        QueueDate: queue.QueueDate.Date,
                        BeforePosition: queue.Position,
                        AfterPosition: queueItem.Position,
                        Round: currentRound));

                    queue.Position = queueItem.Position;
                    queue.Status = queueItem.Status;
                    // When UpdateMaster=true, sync InitialPosition so daily reset
                    // uses this new order as the rotation base going forward.
                    if (request.UpdateMaster)
                    {
                        queue.InitialPosition = queueItem.Position;
                    }
                    // Round is NOT modified - preserve existing Round value
                    queue.UpdatedDate = DateTimeOffset.UtcNow;
                    
                    _logger.LogDebug(
                        "Updating queue {QueueId} - EmployeeId: {EmployeeId}, Position: {OldPos} -> {NewPos}, Round: {Round} (preserved)",
                        queue.Id, queue.EmployeeId, queue.Position, queueItem.Position, currentRound);
                    
                    _queueRepository.Update(queue);
                    updatedCount++;
                }

                var deleteIds = request.DeletedQueueIds?.Distinct().ToList() ?? new List<Guid>();
                foreach (var queueId in deleteIds)
                {
                    var queue = await _queueRepository.Get(queueId, cancellationToken);
                    if (queue == null)
                    {
                        notFoundIds.Add(queueId);
                        _logger.LogWarning("Queue with Id: {QueueId} not found for delete in bulk update", queueId);
                        continue;
                    }

                    queuesForAudit.Add((
                        QueueId: queue.Id,
                        EmployeeId: queue.EmployeeId,
                        QueueDate: queue.QueueDate.Date,
                        BeforePosition: queue.Position,
                        AfterPosition: null,
                        Round: queue.Round));

                    _queueRepository.Delete(queue);
                    deletedCount++;
                }

                if (notFoundIds.Any())
                {
                    _logger.LogWarning("Some queues were not found: {NotFoundIds}", string.Join(", ", notFoundIds));
                }

                if (updatedCount == 0 && deletedCount == 0)
                {
                    throw new NoDataFoundException("No queues were found to update or delete.");
                }

                // Write audit logs grouped by queue date (so multi-day edits don't mix)
                foreach (var group in queuesForAudit.GroupBy(q => q.QueueDate))
                {
                    var beforeList = group
                        .Select(x => new { id = x.QueueId, employeeId = x.EmployeeId, position = x.BeforePosition, round = x.Round })
                        .OrderBy(x => x.position)
                        .ToList();

                    var afterList = group
                        .Where(x => x.AfterPosition.HasValue)
                        .Select(x => new { id = x.QueueId, employeeId = x.EmployeeId, position = x.AfterPosition!.Value, round = x.Round })
                        .OrderBy(x => x.position)
                        .ToList();

                    var reorderType = request.UpdateMaster ? "Master (persistent)" : "Today-only (position only)";
                    var auditLog = new AuditLog
                    {
                        ActorId = _currentUserService.UserId ?? Guid.Empty,
                        ActorName = _currentUserService.EmployeeId?.ToString() ?? "Admin",
                        ActionType = AuditActionType.QueueReorder,
                        EntityType = "Queue",
                        EntityId = group.First().QueueId,
                        BeforeJson = JsonSerializer.Serialize(beforeList),
                        AfterJson = JsonSerializer.Serialize(afterList),
                        Reason = $"Admin override: Queue reorder [{reorderType}] for {group.Key:yyyy-MM-dd}. Round values preserved.",
                        Timestamp = DateTimeOffset.UtcNow
                    };
                    _auditLogRepository.Create(auditLog);
                    
                    _logger.LogInformation(
                        "Audit log created for Master Queue admin override on {Date}. " +
                        "Updated: {UpdatedCount}, Deleted: {DeletedCount}. Round values preserved.",
                        group.Key.ToString("yyyy-MM-dd"),
                        afterList.Count,
                        group.Count(g => !g.AfterPosition.HasValue));
                }

                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation(
                    "Admin override: Queue bulk update completed. Type={UpdateMaster}, " +
                    "Updated: {UpdatedCount}, Deleted: {DeletedCount}. Round values preserved.",
                    request.UpdateMaster ? "Master(persistent)" : "Today-only",
                    updatedCount, deletedCount);
                return new BulkUpdateResponse(updatedCount, deletedCount, DateTimeOffset.UtcNow);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk updating queues");
                throw;
            }
        }
    }
}

