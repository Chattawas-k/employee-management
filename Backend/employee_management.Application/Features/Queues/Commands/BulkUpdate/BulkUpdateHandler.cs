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
                int updatedCount = 0;
                int deletedCount = 0;
                var notFoundIds = new List<Guid>();

                // Capture before/after for audit (Master Queue reorder)
                var queuesForAudit = new List<(Guid QueueId, Guid EmployeeId, DateTime QueueDate, int BeforePosition, int? AfterPosition)>();

                foreach (var queueItem in request.Queues)
                {
                    var queue = await _queueRepository.Get(queueItem.Id, cancellationToken);
                    if (queue == null)
                    {
                        notFoundIds.Add(queueItem.Id);
                        _logger.LogWarning("Queue with Id: {QueueId} not found for bulk update", queueItem.Id);
                        continue;
                    }

                    queuesForAudit.Add((
                        QueueId: queue.Id,
                        EmployeeId: queue.EmployeeId,
                        QueueDate: queue.QueueDate.Date,
                        BeforePosition: queue.Position,
                        AfterPosition: queueItem.Position));

                    queue.Position = queueItem.Position;
                    queue.Status = queueItem.Status;
                    queue.UpdatedDate = DateTimeOffset.UtcNow;
                    
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
                        AfterPosition: null));

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
                        .Select(x => new { id = x.QueueId, employeeId = x.EmployeeId, position = x.BeforePosition })
                        .OrderBy(x => x.position)
                        .ToList();

                    var afterList = group
                        .Where(x => x.AfterPosition.HasValue)
                        .Select(x => new { id = x.QueueId, employeeId = x.EmployeeId, position = x.AfterPosition!.Value })
                        .OrderBy(x => x.position)
                        .ToList();

                    var auditLog = new AuditLog
                    {
                        ActorId = _currentUserService.UserId ?? Guid.Empty,
                        ActorName = _currentUserService.EmployeeId?.ToString() ?? "Admin",
                        ActionType = AuditActionType.QueueReorder,
                        EntityType = "Queue",
                        EntityId = group.First().QueueId,
                        BeforeJson = JsonSerializer.Serialize(beforeList),
                        AfterJson = JsonSerializer.Serialize(afterList),
                        Reason = $"Master Queue update (reorder/delete) for {group.Key:yyyy-MM-dd}",
                        Timestamp = DateTimeOffset.UtcNow
                    };
                    _auditLogRepository.Create(auditLog);
                }

                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation("Bulk update completed. Updated: {UpdatedCount}, Deleted: {DeletedCount}", updatedCount, deletedCount);
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

