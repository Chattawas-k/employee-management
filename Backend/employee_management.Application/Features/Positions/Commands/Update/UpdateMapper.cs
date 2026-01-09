using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Positions.Commands.Update
{
    public sealed class UpdateMapper : Profile
    {
        public UpdateMapper()
        {
            CreateMap<UpdateRequest, Position>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Department, opt => opt.Ignore());
            CreateMap<Position, UpdateResponse>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null));
        }
    }
}
