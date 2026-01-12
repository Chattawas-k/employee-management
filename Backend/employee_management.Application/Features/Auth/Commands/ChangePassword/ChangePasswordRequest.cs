using MediatR;

namespace employee_management.Application.Features.Auth.Commands.ChangePassword
{
    public class ChangePasswordRequest : IRequest<ChangePasswordResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
        public required string ConfirmPassword { get; set; }
    }
}
