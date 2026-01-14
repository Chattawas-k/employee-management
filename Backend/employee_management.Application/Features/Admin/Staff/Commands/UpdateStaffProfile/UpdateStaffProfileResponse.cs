using employee_management.Application.Features.Admin.Staff.Models;

namespace employee_management.Application.Features.Admin.Staff.Commands.UpdateStaffProfile
{
    public sealed record UpdateStaffProfileResponse(
        StaffListItemDto Staff
    );
}

