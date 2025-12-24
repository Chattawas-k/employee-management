using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Commands.Update
{
    public sealed class UpdateHandler : IRequestHandler<UpdateRequest, UpdateResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateHandler> _logger;

        public UpdateHandler(IUnitOfWork unitOfWork, IEmployeeRepository employeeRepository, IMapper mapper, ILogger<UpdateHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<UpdateResponse> Handle(UpdateRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var employee = await _employeeRepository.Get(request.Id, cancellationToken);
                if (employee == null)
                {
                    _logger.LogWarning("Employee with Id: {EmployeeId} not found for update", request.Id);
                    throw new NoDataFoundException($"Employee with Id {request.Id} not found.");
                }

                _mapper.Map(request, employee);
                _employeeRepository.Update(employee);
                await _unitOfWork.Save(cancellationToken);

                return _mapper.Map<UpdateResponse>(employee);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee with Id: {EmployeeId}", request.Id);
                throw;
            }
        }
    }
}

