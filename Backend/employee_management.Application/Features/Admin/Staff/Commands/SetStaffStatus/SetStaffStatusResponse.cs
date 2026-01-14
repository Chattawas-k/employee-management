using employee_management.Application.Features.Admin.Staff.Models;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffStatus
{
    public sealed record SetStaffStatusResponse(
        StaffListItemDto Staff
    );
}

