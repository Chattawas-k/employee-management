using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Employees.Queries.DropdownList
{
    public sealed class DropdownListHandler : IRequestHandler<DropdownListRequest, List<DropdownListResponse>>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<DropdownListHandler> _logger;

        public DropdownListHandler(
            IEmployeeRepository employeeRepository,
            IMapper mapper,
            ILogger<DropdownListHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<DropdownListResponse>> Handle(DropdownListRequest request, CancellationToken cancellationToken)
        {
            try
            {
                // Use SearchAsync with large pageSize to get all matching employees
                var result = await _employeeRepository.SearchAsync(
                    keyword: null,
                    pageNumber: 1,
                    pageSize: 10000, // Large page size to get all employees
                    sortBy: "Name",
                    sortDirection: "asc",
                    status: request.Status,
                    departmentId: request.DepartmentId,
                    positionId: request.PositionId,
                    cancellationToken);

                var response = _mapper.Map<List<DropdownListResponse>>(result.Items);

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employee dropdown list");
                throw;
            }
        }
    }
}

