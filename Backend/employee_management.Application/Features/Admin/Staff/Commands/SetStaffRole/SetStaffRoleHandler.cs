using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Features.Admin.Staff.Models;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffRole
{
    public sealed class SetStaffRoleHandler : IRequestHandler<SetStaffRoleRequest, SetStaffRoleResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<SetStaffRoleHandler> _logger;

        public SetStaffRoleHandler(
            IEmployeeRepository employeeRepository,
            UserManager<User> userManager,
            RoleManager<Role> roleManager,
            ICurrentUserService currentUserService,
            ILogger<SetStaffRoleHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _userManager = userManager;
            _roleManager = roleManager;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<SetStaffRoleResponse> Handle(SetStaffRoleRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var employee = await _employeeRepository.Get(request.StaffId, cancellationToken);
                if (employee == null)
                {
                    throw new NoDataFoundException($"Employee with Id {request.StaffId} not found.");
                }

                var user = await _userManager.Users
                    .Where(u => u.EmployeeId == request.StaffId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (user == null)
                {
                    throw new NoDataFoundException($"User linked to EmployeeId {request.StaffId} not found.");
                }

                var roleToAssign = request.Role.Trim();

                // Only SuperAdmin can assign SuperAdmin
                if (roleToAssign.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
                {
                    var currentUserId = _currentUserService.UserId?.ToString();
                    if (string.IsNullOrWhiteSpace(currentUserId))
                    {
                        throw new InvalidOperationException("Unauthorized.");
                    }
                    var currentUser = await _userManager.FindByIdAsync(currentUserId);
                    if (currentUser == null || !await _userManager.IsInRoleAsync(currentUser, "SuperAdmin"))
                    {
                        throw new InvalidOperationException("Only SuperAdmin can assign SuperAdmin role.");
                    }
                }

                if (!await _roleManager.RoleExistsAsync(roleToAssign))
                {
                    await _roleManager.CreateAsync(new Role(roleToAssign));
                }

                // Replace roles with the single selected role
                var currentRoles = await _userManager.GetRolesAsync(user);
                if (currentRoles.Count > 0)
                {
                    var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                    if (!removeResult.Succeeded)
                    {
                        var message = string.Join("; ", removeResult.Errors.Select(e => e.Description));
                        throw new InvalidOperationException(message);
                    }
                }

                var addResult = await _userManager.AddToRoleAsync(user, roleToAssign);
                if (!addResult.Succeeded)
                {
                    var message = string.Join("; ", addResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException(message);
                }

                var accountStatus = employee.Status == EmployeeStatus.Active ? AccountStatus.Active : AccountStatus.Disabled;

                var dto = new StaffListItemDto(
                    StaffId: employee.Id,
                    FullName: employee.Name,
                    PositionId: employee.PositionId,
                    Position: employee.Position?.Name ?? string.Empty,
                    ProfileImageUrl: employee.Avatar,
                    Email: user.Email ?? string.Empty,
                    UserName: user.UserName ?? string.Empty,
                    AccountStatus: accountStatus,
                    Roles: new List<string> { roleToAssign }
                );

                return new SetStaffRoleResponse(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting staff role for EmployeeId: {EmployeeId}", request.StaffId);
                throw;
            }
        }
    }
}

