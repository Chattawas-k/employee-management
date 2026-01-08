using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.QueuesRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Commands.Delete
{
    public sealed class DeleteHandler : IRequestHandler<DeleteRequest, Unit>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly ILogger<DeleteHandler> _logger;

        public DeleteHandler(
            IUnitOfWork unitOfWork,
            IQueueRepository queueRepository,
            ILogger<DeleteHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var queue = await _queueRepository.Get(request.Id, cancellationToken);
                if (queue == null)
                {
                    _logger.LogWarning("Queue with Id: {QueueId} not found for deletion", request.Id);
                    throw new NoDataFoundException($"Queue with Id {request.Id} not found.");
                }

                _queueRepository.Delete(queue);
                await _unitOfWork.Save(cancellationToken);

                _logger.LogInformation("Queue with Id: {QueueId} deleted successfully", request.Id);
                return Unit.Value;
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting queue with Id: {QueueId}", request.Id);
                throw;
            }
        }
    }
}

