using MediatR;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffRole
{
    public sealed record SetStaffRoleRequest(
        Guid StaffId,
        string Role
    ) : IRequest<SetStaffRoleResponse>;
}

