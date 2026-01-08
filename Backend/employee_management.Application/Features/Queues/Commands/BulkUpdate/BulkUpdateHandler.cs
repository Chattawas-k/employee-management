using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.QueuesRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Commands.BulkUpdate
{
    public sealed class BulkUpdateHandler : IRequestHandler<BulkUpdateRequest, BulkUpdateResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly ILogger<BulkUpdateHandler> _logger;

        public BulkUpdateHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            ILogger<BulkUpdateHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _logger = logger;
        }

        public async Task<BulkUpdateResponse> Handle(BulkUpdateRequest request, CancellationToken cancellationToken)
        {
            try
            {
                int updatedCount = 0;
                var notFoundIds = new List<Guid>();

                foreach (var queueItem in request.Queues)
                {
                    var queue = await _queueRepository.Get(queueItem.Id, cancellationToken);
                    if (queue == null)
                    {
                        notFoundIds.Add(queueItem.Id);
                        _logger.LogWarning("Queue with Id: {QueueId} not found for bulk update", queueItem.Id);
                        continue;
                    }

                    queue.Position = queueItem.Position;
                    queue.Status = queueItem.Status;
                    queue.UpdatedDate = DateTimeOffset.UtcNow;
                    
                    _queueRepository.Update(queue);
                    updatedCount++;
                }

                if (notFoundIds.Any())
                {
                    _logger.LogWarning("Some queues were not found: {NotFoundIds}", string.Join(", ", notFoundIds));
                }

                if (updatedCount == 0)
                {
                    throw new NoDataFoundException("No queues were found to update.");
                }

                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation("Bulk updated {Count} queues successfully", updatedCount);
                return new BulkUpdateResponse(updatedCount, DateTimeOffset.UtcNow);
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

