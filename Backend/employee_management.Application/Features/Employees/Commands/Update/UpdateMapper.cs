using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Employees.Commands.Update
{
    public sealed class UpdateMapper : Profile
    {
        public UpdateMapper()
        {
            CreateMap<UpdateRequest, Employee>();
            CreateMap<Employee, UpdateResponse>();
        }
    }
}

