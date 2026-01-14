using employee_management.Application.Features.Admin.Staff.Models;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffRole
{
    public sealed record SetStaffRoleResponse(
        StaffListItemDto Staff
    );
}

