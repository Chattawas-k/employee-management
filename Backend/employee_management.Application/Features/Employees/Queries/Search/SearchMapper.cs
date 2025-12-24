using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Employees.Queries.Search
{
    public sealed class SearchMapper : Profile
    {
        public SearchMapper()
        {
            CreateMap<Employee, SearchResponse>()
                .ForCtorParam(nameof(SearchResponse.PositionName),
                    opt => opt.MapFrom(src => src.Position != null ? src.Position.Name : null))
                .ForCtorParam(nameof(SearchResponse.DepartmentName),
                    opt => opt.MapFrom(src => src.Position != null && src.Position.Department != null ? src.Position.Department.Name : null));
        }
    }
}

