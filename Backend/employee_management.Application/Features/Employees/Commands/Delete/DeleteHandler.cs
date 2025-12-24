using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Commands.Delete
{
    public sealed class DeleteHandler : IRequestHandler<DeleteRequest, Unit>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<DeleteHandler> _logger;

        public DeleteHandler(IUnitOfWork unitOfWork, IEmployeeRepository employeeRepository, ILogger<DeleteHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var employee = await _employeeRepository.Get(request.Id, cancellationToken);
                if (employee == null)
                {
                    _logger.LogWarning("Employee with Id: {EmployeeId} not found for deletion", request.Id);
                    throw new NoDataFoundException($"Employee with Id {request.Id} not found.");
                }

                _employeeRepository.Delete(employee);
                await _unitOfWork.Save(cancellationToken);

                return Unit.Value;
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting employee with Id: {EmployeeId}", request.Id);
                throw;
            }
        }
    }
}

