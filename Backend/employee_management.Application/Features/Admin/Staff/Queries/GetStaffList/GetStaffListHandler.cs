using employee_management.Application.Features.Admin.Staff.Models;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Admin.Staff.Queries.GetStaffList
{
    public sealed class GetStaffListHandler : IRequestHandler<GetStaffListRequest, GetStaffListResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<GetStaffListHandler> _logger;

        public GetStaffListHandler(
            UserManager<User> userManager,
            ILogger<GetStaffListHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<GetStaffListResponse> Handle(GetStaffListRequest request, CancellationToken cancellationToken)
        {
            try
            {
                // Staff accounts are Identity users linked to an Employee record.
                var users = await _userManager.Users
                    .AsNoTracking()
                    .Where(u => u.EmployeeId.HasValue && u.EmployeeId.Value != Guid.Empty)
                    .Include(u => u.Employee)
                    .ThenInclude(e => e!.Position)
                    .OrderBy(u => u.Employee!.Name)
                    .ToListAsync(cancellationToken);

                var staff = new List<StaffListItemDto>(capacity: users.Count);

                foreach (var user in users)
                {
                    var employee = user.Employee;
                    if (employee == null || employee.IsDeleted)
                    {
                        continue;
                    }

                    var accountStatus = employee.Status == EmployeeStatus.Active
                        ? AccountStatus.Active
                        : AccountStatus.Disabled;

                    var roles = await _userManager.GetRolesAsync(user);

                    if (request.BasicOnly)
                    {
                        // Basic-only = has Basic AND does NOT have any of Admin/SuperAdmin/Manager
                        var normalized = roles.Select(r => (r ?? string.Empty).Trim()).ToList();
                        var hasBasic = normalized.Any(r => r.Equals("Basic", StringComparison.OrdinalIgnoreCase));
                        var hasForbidden = normalized.Any(r =>
                            r.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                            r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                            r.Equals("Manager", StringComparison.OrdinalIgnoreCase));

                        if (!hasBasic || hasForbidden)
                        {
                            continue;
                        }
                    }

                    staff.Add(new StaffListItemDto(
                        StaffId: employee.Id,
                        FullName: employee.Name,
                        PositionId: employee.PositionId,
                        Position: employee.Position?.Name ?? string.Empty,
                        ProfileImageUrl: employee.Avatar,
                        Email: user.Email ?? string.Empty,
                        UserName: user.UserName ?? string.Empty,
                        AccountStatus: accountStatus,
                        Roles: roles.ToList()
                    ));
                }

                return new GetStaffListResponse(staff);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching staff list.");
                throw;
            }
        }
    }
}

