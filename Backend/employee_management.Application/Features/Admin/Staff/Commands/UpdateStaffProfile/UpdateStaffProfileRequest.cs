using MediatR;

namespace employee_management.Application.Features.Admin.Staff.Commands.UpdateStaffProfile
{
    public sealed record UpdateStaffProfileRequest(
        Guid StaffId,
        string FullName,
        Guid PositionId,
        string? ProfileImageDataUrl,
        bool RemoveProfileImage
    ) : IRequest<UpdateStaffProfileResponse>;
}

