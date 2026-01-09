using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Positions.Commands.Add
{
    public sealed class AddMapper : Profile
    {
        public AddMapper()
        {
            CreateMap<AddRequest, Position>();
            CreateMap<Position, AddResponse>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null));
        }
    }
}
