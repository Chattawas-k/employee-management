using AutoMapper;
using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.PositionsRepository;
using employee_management.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Positions.Commands.Add
{
    public sealed class AddHandler : IRequestHandler<AddRequest, AddResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPositionRepository _positionRepository;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;
        private readonly ILogger<AddHandler> _logger;

        public AddHandler(IUnitOfWork unitOfWork, 
            IPositionRepository positionRepository, IMapper mapper, IMemoryCache cache, ILogger<AddHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _positionRepository = positionRepository;
            _mapper = mapper;
            _cache = cache;
            _logger = logger;
        }

        public async Task<AddResponse> Handle(AddRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var position = _mapper.Map<Position>(request);
                _positionRepository.Create(position);
                await _unitOfWork.Save(cancellationToken);

                // Invalidate cache
                InvalidatePositionCache(request.DepartmentId);

                // Reload to get Department relationship
                var createdPosition = await _positionRepository.Get(position.Id, cancellationToken);
                if (createdPosition == null)
                {
                    throw new InvalidOperationException("Failed to retrieve created position");
                }

                return _mapper.Map<AddResponse>(createdPosition);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating position with name: {PositionName}", request.Name);
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
