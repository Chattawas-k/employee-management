using employee_management.Application.Features.Admin.Staff.Models;

namespace employee_management.Application.Features.Admin.Staff.Queries.GetStaffList
{
    public sealed record GetStaffListResponse(
        List<StaffListItemDto> Staff
    );
}

