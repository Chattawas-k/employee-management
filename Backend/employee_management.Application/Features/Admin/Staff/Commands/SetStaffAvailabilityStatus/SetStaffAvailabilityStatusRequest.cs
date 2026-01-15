using MediatR;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffAvailabilityStatus
{
    public sealed record SetStaffAvailabilityStatusRequest(
        Guid StaffId,
        string Status,
        Guid ChangedByEmployeeId
    ) : IRequest<SetStaffAvailabilityStatusResponse>;
}

