using AutoMapper;
using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Commands.Add
{
    public sealed class AddHandler : IRequestHandler<AddRequest, AddResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<AddHandler> _logger;

        public AddHandler(IUnitOfWork unitOfWork, 
            IEmployeeRepository employeeRepository, IMapper mapper, ILogger<AddHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<AddResponse> Handle(AddRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var employee = _mapper.Map<Employee>(request);
                _employeeRepository.Create(employee);
                await _unitOfWork.Save(cancellationToken);

                return _mapper.Map<AddResponse>(employee);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee with name: {EmployeeName}", request.Name);
                throw;
            }
        }
    }
}

