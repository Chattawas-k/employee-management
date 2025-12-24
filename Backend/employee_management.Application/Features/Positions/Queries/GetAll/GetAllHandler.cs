using AutoMapper;
using MediatR;
using employee_management.Application.Repository.PositionsRepository;
using Microsoft.Extensions.Caching.Memory;

namespace employee_management.Application.Features.Positions.Queries.GetAll
{
    public sealed class GetAllHandler : IRequestHandler<GetAllRequest, List<GetAllPositionsResponse>>
    {
        private readonly IPositionRepository _positionRepository;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;

        public GetAllHandler(IPositionRepository positionRepository, IMapper mapper, IMemoryCache cache)
        {
            _positionRepository = positionRepository;
            _mapper = mapper;
            _cache = cache;
        }

        public async Task<List<GetAllPositionsResponse>> Handle(GetAllRequest request, CancellationToken cancellationToken)
        {
            string cacheKey = request.DepartmentId.HasValue 
                ? $"positions_department_{request.DepartmentId.Value}" 
                : "positions_all";

            if (_cache.TryGetValue(cacheKey, out List<GetAllPositionsResponse>? cachedPositions) && cachedPositions != null)
            {
                return cachedPositions;
            }

            List<Domain.Entities.Position> positions;
            
            if (request.DepartmentId.HasValue)
            {
                positions = await _positionRepository.GetByDepartmentIdAsync(request.DepartmentId.Value, cancellationToken);
            }
            else
            {
                positions = await _positionRepository.GetAllAsync(cancellationToken);
            }

            var response = _mapper.Map<List<GetAllPositionsResponse>>(positions);

            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30),
                SlidingExpiration = TimeSpan.FromMinutes(10)
            };

            _cache.Set(cacheKey, response, cacheOptions);

            return response;
        }
    }
}

