using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Features.Employees.Queries.Get;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Commands.UpdateMyAvatar
{
    public sealed class UpdateMyAvatarHandler : IRequestHandler<UpdateMyAvatarRequest, UpdateMyAvatarResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateMyAvatarHandler> _logger;

        public UpdateMyAvatarHandler(
            IUnitOfWork unitOfWork,
            IEmployeeRepository employeeRepository,
            IMapper mapper,
            ILogger<UpdateMyAvatarHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<UpdateMyAvatarResponse> Handle(UpdateMyAvatarRequest request, CancellationToken cancellationToken)
        {
            var employee = await _employeeRepository.Get(request.EmployeeId, cancellationToken);
            if (employee == null)
            {
                _logger.LogWarning("Employee with Id: {EmployeeId} not found for avatar update", request.EmployeeId);
                throw new NoDataFoundException($"Employee with Id {request.EmployeeId} not found.");
            }

            // Store avatar in database (Employee.Avatar) as a data URL string.
            employee.Avatar = string.IsNullOrWhiteSpace(request.AvatarDataUrl) ? null : request.AvatarDataUrl;

            _employeeRepository.Update(employee);
            await _unitOfWork.Save(cancellationToken);

            var dto = _mapper.Map<EmployeeGetResponse>(employee);
            return new UpdateMyAvatarResponse(dto);
        }
    }
}

