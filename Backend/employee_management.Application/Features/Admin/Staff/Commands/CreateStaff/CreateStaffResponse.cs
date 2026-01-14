using employee_management.Application.Features.Admin.Staff.Models;

namespace employee_management.Application.Features.Admin.Staff.Commands.CreateStaff
{
    public sealed record CreateStaffResponse(
        StaffListItemDto Staff
    );
}

