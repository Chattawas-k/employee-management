using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Models;
using employee_management.Application.Repository.EmployeesRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Queries.Search
{
    public sealed class SearchHandler : IRequestHandler<SearchRequest, PaginatedList<SearchResponse>>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<SearchHandler> _logger;

        // Whitelist of allowed sort fields mapped to entity property paths
        private static readonly Dictionary<string, string> AllowedSortFields = new(StringComparer.OrdinalIgnoreCase)
        {
            { "name", "Name" },
            { "status", "Status" },
            { "positionname", "Position.Name" },
            { "position_name", "Position.Name" },
            { "departmentname", "Position.Department.Name" },
            { "department_name", "Position.Department.Name" },
            { "createddate", "CreatedDate" },
            { "created_date", "CreatedDate" },
            { "updateddate", "UpdatedDate" },
            { "updated_date", "UpdatedDate" }
        };

        public SearchHandler(IEmployeeRepository employeeRepository, IMapper mapper, ILogger<SearchHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<PaginatedList<SearchResponse>> Handle(SearchRequest request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Searching employees with keyword: {Keyword}, PageNumber: {PageNumber}, PageSize: {PageSize}", 
                request.Keyword, request.PageNumber, request.PageSize);

            try
            {
                // Map frontend sort field names to entity property paths and validate
                string? mappedSortBy = MapAndValidateSortField(request.SortBy);

                var employees = await _employeeRepository.SearchAsync(
                    request.Keyword,
                    request.PageNumber,
                    request.PageSize,
                    mappedSortBy,
                    request.SortDirection,
                    request.Status,
                    request.DepartmentId,
                    request.PositionId,
                    cancellationToken);

                var employeeResponses = _mapper.Map<List<SearchResponse>>(employees.Items);
                
                _logger.LogInformation("Employee search completed. Found {Count} employees out of {TotalCount}", 
                    employees.Items.Count, employees.TotalCount);

                return new PaginatedList<SearchResponse>(
                    employeeResponses,
                    employees.TotalCount,
                    employees.PageNumber,
                    request.PageSize);
            }
            catch (BadRequestException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching employees with keyword: {Keyword}", request.Keyword);
                throw;
            }
        }

        private static string? MapAndValidateSortField(string? sortBy)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
                return null;

            // Validate against whitelist
            if (!AllowedSortFields.TryGetValue(sortBy, out var mappedField))
            {
                throw new BadRequestException($"Invalid sort field: '{sortBy}'. Allowed fields are: {string.Join(", ", AllowedSortFields.Keys)}");
            }

            return mappedField;
        }
    }
}

