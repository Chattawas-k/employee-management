using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffAvailabilityStatus
{
    public sealed record SetStaffAvailabilityStatusResponse(
        Guid EmployeeId,
        AvailabilityStatus AvailabilityStatus,
        QueueStatus QueueStatus,
        DateTimeOffset? UpdatedDate
    );
}

