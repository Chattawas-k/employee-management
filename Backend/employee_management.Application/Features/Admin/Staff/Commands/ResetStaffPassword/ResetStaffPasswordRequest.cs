using MediatR;

namespace employee_management.Application.Features.Admin.Staff.Commands.ResetStaffPassword
{
    public sealed record ResetStaffPasswordRequest(
        Guid StaffId,
        string NewPassword
    ) : IRequest<ResetStaffPasswordResponse>;
}

