using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.PositionsRepository;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Positions.Commands.Delete
{
    public sealed class DeleteHandler : IRequestHandler<DeleteRequest, Unit>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPositionRepository _positionRepository;
        private readonly IMemoryCache _cache;
        private readonly ILogger<DeleteHandler> _logger;

        public DeleteHandler(IUnitOfWork unitOfWork, IPositionRepository positionRepository, IMemoryCache cache, ILogger<DeleteHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _positionRepository = positionRepository;
            _cache = cache;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var position = await _positionRepository.Get(request.Id, cancellationToken);
                if (position == null)
                {
                    _logger.LogWarning("Position with Id: {PositionId} not found for deletion", request.Id);
                    throw new NoDataFoundException($"Position with Id {request.Id} not found.");
                }

                var departmentId = position.DepartmentId;
                _positionRepository.Delete(position);
                await _unitOfWork.Save(cancellationToken);

                // Invalidate cache
                InvalidatePositionCache(departmentId);

                return Unit.Value;
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting position with Id: {PositionId}", request.Id);
                throw;
            }
        }

        private void InvalidatePositionCache(Guid? departmentId = null)
        {
            // Remove all positions cache entries
            _cache.Remove("positions_all");
            if (departmentId.HasValue)
            {
                _cache.Remove($"positions_department_{departmentId.Value}");
            }
        }
    }
}
