using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.TestTakers.Queries.Get
{
    public sealed class GetMapper : Profile
    {
        public GetMapper()
        {
            CreateMap<TestTaker, GetTestTakerResponse>();
        }
    }
}
