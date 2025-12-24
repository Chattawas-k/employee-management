using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Employees.Queries.DropdownList
{
    public sealed class DropdownListMapper : Profile
    {
        public DropdownListMapper()
        {
            CreateMap<Employee, DropdownListResponse>()
                .ForCtorParam(nameof(DropdownListResponse.PositionName),
                    opt => opt.MapFrom(src => src.Position != null ? src.Position.Name : null))
                .ForCtorParam(nameof(DropdownListResponse.DepartmentName),
                    opt => opt.MapFrom(src => src.Position != null && src.Position.Department != null ? src.Position.Department.Name : null));
        }
    }
}

