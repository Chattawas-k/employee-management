using employee_management.Application.Features.Admin.Staff.Models;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Admin.Staff.Commands.CreateStaff
{
    public sealed class CreateStaffHandler : IRequestHandler<CreateStaffRequest, CreateStaffResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<CreateStaffHandler> _logger;

        public CreateStaffHandler(
            IUnitOfWork unitOfWork,
            IEmployeeRepository employeeRepository,
            UserManager<User> userManager,
            RoleManager<Role> roleManager,
            ICurrentUserService currentUserService,
            ILogger<CreateStaffHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _userManager = userManager;
            _roleManager = roleManager;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<CreateStaffResponse> Handle(CreateStaffRequest request, CancellationToken cancellationToken)
        {
            // Login uses email, and Identity requires unique Email; treat this field as Email for staff accounts.
            var email = request.Email.Trim();

            // 1) Create Employee profile
            var employee = new Employee
            {
                Name = request.FullName.Trim(),
                PositionId = request.PositionId,
                Status = EmployeeStatus.Active,
                Avatar = string.IsNullOrWhiteSpace(request.ProfileImageDataUrl) ? null : request.ProfileImageDataUrl
            };

            _employeeRepository.Create(employee);
            await _unitOfWork.Save(cancellationToken);

            try
            {
                // 2) Create Identity user linked to Employee
                var user = new User
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    EmployeeId = employee.Id
                };

                var createResult = await _userManager.CreateAsync(user, request.Password);
                if (!createResult.Succeeded)
                {
                    var message = string.Join("; ", createResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException(message);
                }

                // 3) Ensure role exists, then assign it
                var roleToAssign = request.Role?.Trim();
                if (string.IsNullOrWhiteSpace(roleToAssign))
                {
                    roleToAssign = "Basic";
                }

                if (roleToAssign.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
                {
                    // Only SuperAdmin can create another SuperAdmin.
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

                var roleResult = await _userManager.AddToRoleAsync(user, roleToAssign);
                if (!roleResult.Succeeded)
                {
                    var message = string.Join("; ", roleResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException(message);
                }

                // Load position name for response
                var employeeWithPosition = await _employeeRepository.Get(employee.Id, cancellationToken);
                var positionName = employeeWithPosition?.Position?.Name ?? string.Empty;

                var dto = new StaffListItemDto(
                    StaffId: employee.Id,
                    FullName: employee.Name,
                    PositionId: employee.PositionId,
                    Position: positionName,
                    ProfileImageUrl: employee.Avatar,
                    Email: user.Email ?? email,
                    UserName: user.UserName ?? email,
                    AccountStatus: AccountStatus.Active,
                    Roles: new List<string> { roleToAssign }
                );

                return new CreateStaffResponse(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating staff user for EmployeeId: {EmployeeId}", employee.Id);

                // Best-effort cleanup: remove the employee record if user creation fails.
                try
                {
                    var createdEmployee = await _employeeRepository.Get(employee.Id, cancellationToken);
                    if (createdEmployee != null)
                    {
                        _employeeRepository.Delete(createdEmployee);
                        await _unitOfWork.Save(cancellationToken);
                    }
                }
                catch (Exception cleanupEx)
                {
                    _logger.LogError(cleanupEx, "Failed to cleanup employee after staff creation failure. EmployeeId: {EmployeeId}", employee.Id);
                }

                throw;
            }
        }
    }
}

