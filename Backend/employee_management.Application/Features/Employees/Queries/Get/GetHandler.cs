using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository.EmployeesRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Queries.Get
{
    public sealed class GetHandler : IRequestHandler<GetRequest, EmployeeGetResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetHandler> _logger;

        public GetHandler(IEmployeeRepository employeeRepository, IMapper mapper, ILogger<GetHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<EmployeeGetResponse> Handle(GetRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var employee = await _employeeRepository.Get(request.Id, cancellationToken);
                if (employee == null)
                {
                    _logger.LogWarning("Employee with Id: {EmployeeId} not found", request.Id);
                    throw new NoDataFoundException($"Employee with Id {request.Id} not found.");
                }

                return _mapper.Map<EmployeeGetResponse>(employee);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee with Id: {EmployeeId}", request.Id);
                throw;
            }
        }
    }
}

