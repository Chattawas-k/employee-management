using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Departments.Queries.GetAll
{
    public sealed class GetAllMapper : Profile
    {
        public GetAllMapper()
        {
            CreateMap<Department, GetAllDepartmentsResponse>();
        }
    }
}

