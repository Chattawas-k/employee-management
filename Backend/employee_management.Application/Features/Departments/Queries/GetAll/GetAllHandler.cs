using AutoMapper;
using MediatR;
using employee_management.Application.Repository.DepartmentsRepository;
using Microsoft.Extensions.Caching.Memory;

namespace employee_management.Application.Features.Departments.Queries.GetAll
{
    public sealed class GetAllHandler : IRequestHandler<GetAllRequest, List<GetAllDepartmentsResponse>>
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "departments_all";

        public GetAllHandler(IDepartmentRepository departmentRepository, IMapper mapper, IMemoryCache cache)
        {
            _departmentRepository = departmentRepository;
            _mapper = mapper;
            _cache = cache;
        }

        public async Task<List<GetAllDepartmentsResponse>> Handle(GetAllRequest request, CancellationToken cancellationToken)
        {
            if (_cache.TryGetValue(CacheKey, out List<GetAllDepartmentsResponse>? cachedDepartments) && cachedDepartments != null)
            {
                return cachedDepartments;
            }

            var departments = await _departmentRepository.GetAllAsync(cancellationToken);
            var response = _mapper.Map<List<GetAllDepartmentsResponse>>(departments);

            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30),
                SlidingExpiration = TimeSpan.FromMinutes(10)
            };

            _cache.Set(CacheKey, response, cacheOptions);

            return response;
        }
    }
}

