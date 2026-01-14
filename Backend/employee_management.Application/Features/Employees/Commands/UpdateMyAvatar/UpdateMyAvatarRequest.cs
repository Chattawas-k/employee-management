using MediatR;

namespace employee_management.Application.Features.Employees.Commands.UpdateMyAvatar
{
    public sealed record UpdateMyAvatarRequest(
        Guid EmployeeId,
        string? AvatarDataUrl
    ) : IRequest<UpdateMyAvatarResponse>;
}

