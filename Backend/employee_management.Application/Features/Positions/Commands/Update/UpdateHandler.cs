using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.PositionsRepository;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Positions.Commands.Update
{
    public sealed class UpdateHandler : IRequestHandler<UpdateRequest, UpdateResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPositionRepository _positionRepository;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;
        private readonly ILogger<UpdateHandler> _logger;

        public UpdateHandler(IUnitOfWork unitOfWork, IPositionRepository positionRepository, IMapper mapper, IMemoryCache cache, ILogger<UpdateHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _positionRepository = positionRepository;
            _mapper = mapper;
            _cache = cache;
            _logger = logger;
        }

        public async Task<UpdateResponse> Handle(UpdateRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var position = await _positionRepository.Get(request.Id, cancellationToken);
                if (position == null)
                {
                    _logger.LogWarning("Position with Id: {PositionId} not found for update", request.Id);
                    throw new NoDataFoundException($"Position with Id {request.Id} not found.");
                }

                var oldDepartmentId = position.DepartmentId;
                _mapper.Map(request, position);
                _positionRepository.Update(position);
                await _unitOfWork.Save(cancellationToken);

                // Invalidate cache for both old and new department
                InvalidatePositionCache(oldDepartmentId);
                InvalidatePositionCache(request.DepartmentId);

                // Reload to get Department relationship
                var updatedPosition = await _positionRepository.Get(request.Id, cancellationToken);
                if (updatedPosition == null)
                {
                    throw new InvalidOperationException("Failed to retrieve updated position");
                }

                return _mapper.Map<UpdateResponse>(updatedPosition);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating position with Id: {PositionId}", request.Id);
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
