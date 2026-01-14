using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Employees.Commands.Update
{
    public sealed class UpdateMapper : Profile
    {
        public UpdateMapper()
        {
            // Important: if Avatar is omitted in request (null), do NOT overwrite existing Avatar.
            // Allow clearing by sending empty string (maps to null).
            CreateMap<UpdateRequest, Employee>()
                .ForMember(
                    dest => dest.Avatar,
                    opt =>
                    {
                        opt.Condition(src => src.Avatar != null);
                        opt.MapFrom(src => string.IsNullOrWhiteSpace(src.Avatar) ? null : src.Avatar);
                    });
            CreateMap<Employee, UpdateResponse>();
        }
    }
}

