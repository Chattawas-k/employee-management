using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Employees.Queries.Get
{
    public sealed class GetMapper : Profile
    {
        public GetMapper()
        {
            CreateMap<Employee, EmployeeGetResponse>()
                .ForCtorParam(nameof(EmployeeGetResponse.Id), opt => opt.MapFrom(src => src.Id))
                .ForCtorParam(nameof(EmployeeGetResponse.Name), opt => opt.MapFrom(src => src.Name))
                .ForCtorParam(nameof(EmployeeGetResponse.Phone), opt => opt.MapFrom(src => src.Phone))
                .ForCtorParam(nameof(EmployeeGetResponse.Status), opt => opt.MapFrom(src => src.Status))
                .ForCtorParam(nameof(EmployeeGetResponse.PositionId), opt => opt.MapFrom(src => src.PositionId))
                .ForCtorParam(nameof(EmployeeGetResponse.PositionName),
                    opt => opt.MapFrom(src => src.Position != null ? src.Position.Name : null))
                .ForCtorParam(nameof(EmployeeGetResponse.DepartmentName),
                    opt => opt.MapFrom(src => src.Position != null && src.Position.Department != null ? src.Position.Department.Name : null))
                .ForCtorParam(nameof(EmployeeGetResponse.Avatar), opt => opt.MapFrom(src => src.Avatar))
                .ForCtorParam(nameof(EmployeeGetResponse.CreatedDate), opt => opt.MapFrom(src => src.CreatedDate));
        }
    }
}

