using MediatR;
using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Auth.Commands.ChangePassword
{
    public sealed class ChangePasswordHandler : IRequestHandler<ChangePasswordRequest, ChangePasswordResponse>
    {
        private readonly UserManager<User> _userManager;

        public ChangePasswordHandler(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<ChangePasswordResponse> Handle(ChangePasswordRequest request, CancellationToken cancellationToken)
        {
            // Find user by ID
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "User not found."
                };
            }

            // Verify current password
            var isCurrentPasswordValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
            if (!isCurrentPasswordValid)
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "Current password is incorrect."
                };
            }

            // Change password
            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            
            if (result.Succeeded)
            {
                return new ChangePasswordResponse
                {
                    Success = true,
                    Message = "Password changed successfully."
                };
            }

            // If failed, return error messages
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new ChangePasswordResponse
            {
                Success = false,
                Message = $"Failed to change password: {errors}"
            };
        }
    }
}
