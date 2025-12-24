using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.TestTakers.Commands.Update
{
    public sealed class UpdateMapper : Profile
    {
        public UpdateMapper()
        {
            CreateMap<UpdateTestTakerRequest, TestTaker>();
            CreateMap<TestTaker, UpdateTestTakerResponse>();
        }
    }
}
