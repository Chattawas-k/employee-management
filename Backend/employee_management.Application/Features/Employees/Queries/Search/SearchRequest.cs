using MediatR;
using employee_management.Application.Common.Models;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Employees.Queries.Search
{
    public sealed record SearchRequest(
        string? Keyword,
        int PageNumber = 1,
        int PageSize = 10,
        string? SortBy = null,
        string? SortDirection = "asc",
        EmployeeStatus? Status = null,
        Guid? DepartmentId = null,
        Guid? PositionId = null
    ) : IRequest<PaginatedList<SearchResponse>>;
}

