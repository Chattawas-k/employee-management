using AutoMapper;
using MediatR;
using employee_management.Application.Common.Models;
using employee_management.Application.Repository.TestTakersRepository;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace employee_management.Application.Features.TestTakers.Queries.Search
{
    public sealed class SearchHandler : IRequestHandler<SearchRequest, PaginatedList<SearchTestTakerResponse>>
    {
        private readonly ITestTakerRepository _testTakerRepository;
        private readonly IMapper _mapper;

        public SearchHandler(ITestTakerRepository testTakerRepository, IMapper mapper)
        {
            _testTakerRepository = testTakerRepository;
            _mapper = mapper;
        }

        public async Task<PaginatedList<SearchTestTakerResponse>> Handle(SearchRequest request, CancellationToken cancellationToken)
        {
            var paginatedTestTakers = await _testTakerRepository.SearchAsync(
                request.Keyword,
                request.PageNumber,
                request.PageSize,
                request.SortBy,
                request.SortDirection,
                cancellationToken);

            var mappedItems = _mapper.Map<List<SearchTestTakerResponse>>(paginatedTestTakers.Items);

            return new PaginatedList<SearchTestTakerResponse>(
                mappedItems,
                paginatedTestTakers.TotalCount,
                paginatedTestTakers.PageNumber,
                request.PageSize);
        }
    }
}
