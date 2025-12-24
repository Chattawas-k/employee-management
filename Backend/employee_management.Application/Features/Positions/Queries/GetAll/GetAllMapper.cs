using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Positions.Queries.GetAll
{
    public sealed class GetAllMapper : Profile
    {
        public GetAllMapper()
        {
            CreateMap<Position, GetAllPositionsResponse>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null));
        }
    }
}

