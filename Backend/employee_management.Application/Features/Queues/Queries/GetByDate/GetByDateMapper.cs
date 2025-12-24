using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Queues.Queries.GetByDate
{
    public sealed class GetByDateMapper : Profile
    {
        public GetByDateMapper()
        {
            CreateMap<Queue, GetByDateResponse>()
                .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForMember(dest => dest.PositionName, opt => opt.MapFrom(src => src.Employee != null && src.Employee.Position != null ? src.Employee.Position.Name : null))
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Employee != null && src.Employee.Position != null && src.Employee.Position.Department != null ? src.Employee.Position.Department.Name : null));
        }
    }
}

