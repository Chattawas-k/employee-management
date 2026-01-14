using MediatR;

namespace employee_management.Application.Features.Admin.Staff.Commands.CreateStaff
{
    public sealed record CreateStaffRequest(
        string FullName,
        Guid PositionId,
        string Email,
        string Password,
        string Role,
        string? ProfileImageDataUrl
    ) : IRequest<CreateStaffResponse>;
}

