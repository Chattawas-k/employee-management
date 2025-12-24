using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Employees.Queries.Get
{
    public sealed class GetMapper : Profile
    {
        public GetMapper()
        {
            CreateMap<Employee, EmployeeGetResponse>()
                .ForCtorParam(nameof(EmployeeGetResponse.PositionName),
                    opt => opt.MapFrom(src => src.Position != null ? src.Position.Name : null))
                .ForCtorParam(nameof(EmployeeGetResponse.DepartmentName),
                    opt => opt.MapFrom(src => src.Position != null && src.Position.Department != null ? src.Position.Department.Name : null));
        }
    }
}

