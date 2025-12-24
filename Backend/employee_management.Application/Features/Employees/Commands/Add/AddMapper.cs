using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Employees.Commands.Add
{
    public sealed class AddMapper : Profile
    {
        public AddMapper()
        {
            CreateMap<AddRequest, Employee>();
            CreateMap<Employee, AddResponse>();
        }
    }
}

