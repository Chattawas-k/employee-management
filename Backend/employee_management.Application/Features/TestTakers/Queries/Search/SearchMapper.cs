using AutoMapper;
using employee_management.Application.Features.TestTakers.Queries.Search;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.TestTakers.Queries.Search
{
    public sealed class SearchMapper : Profile
    {
        public SearchMapper()
        {
            CreateMap<TestTaker, SearchTestTakerResponse>();
        }
    }
}
