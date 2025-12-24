using MediatR;
using employee_management.Application.Common.Models;
using System.Collections.Generic;

namespace employee_management.Application.Features.TestTakers.Queries.Search
{
    public sealed record SearchRequest(string? Keyword) 
        : BasePaginationRequest, IRequest<PaginatedList<SearchTestTakerResponse>>;
}
