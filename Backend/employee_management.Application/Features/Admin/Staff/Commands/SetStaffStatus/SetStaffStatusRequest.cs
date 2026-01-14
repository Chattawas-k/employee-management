using MediatR;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffStatus
{
    public sealed record SetStaffStatusRequest(
        Guid StaffId,
        bool IsActive
    ) : IRequest<SetStaffStatusResponse>;
}

