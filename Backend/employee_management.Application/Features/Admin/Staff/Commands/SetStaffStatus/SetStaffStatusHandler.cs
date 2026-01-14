using employee_management.Application.Common.Exceptions;
using employee_management.Application.Features.Admin.Staff.Models;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffStatus
{
    public sealed class SetStaffStatusHandler : IRequestHandler<SetStaffStatusRequest, SetStaffStatusResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<SetStaffStatusHandler> _logger;

        public SetStaffStatusHandler(
            IUnitOfWork unitOfWork,
            IEmployeeRepository employeeRepository,
            UserManager<User> userManager,
            ILogger<SetStaffStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<SetStaffStatusResponse> Handle(SetStaffStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var employee = await _employeeRepository.Get(request.StaffId, cancellationToken);
                if (employee == null)
                {
                    _logger.LogWarning("Employee with Id: {EmployeeId} not found for status change", request.StaffId);
                    throw new NoDataFoundException($"Employee with Id {request.StaffId} not found.");
                }

                employee.Status = request.IsActive ? EmployeeStatus.Active : EmployeeStatus.Inactive;

                _employeeRepository.Update(employee);
                await _unitOfWork.Save(cancellationToken);

                var user = await _userManager.Users
                    .AsNoTracking()
                    .Where(u => u.EmployeeId == employee.Id)
                    .Select(u => new { u.UserName, u.Email })
                    .FirstOrDefaultAsync(cancellationToken);

                var accountStatus = employee.Status == EmployeeStatus.Active ? AccountStatus.Active : AccountStatus.Disabled;

                var dto = new StaffListItemDto(
                    StaffId: employee.Id,
                    FullName: employee.Name,
                    PositionId: employee.PositionId,
                    Position: employee.Position?.Name ?? string.Empty,
                    ProfileImageUrl: employee.Avatar,
                    Email: user?.Email ?? string.Empty,
                    UserName: user?.UserName ?? string.Empty,
                    AccountStatus: accountStatus,
                    Roles: new List<string>()
                );

                return new SetStaffStatusResponse(dto);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting staff status for EmployeeId: {EmployeeId}", request.StaffId);
                throw;
            }
        }
    }
}

