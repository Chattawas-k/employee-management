using employee_management.Application.Common.Exceptions;
using employee_management.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Admin.Staff.Commands.ResetStaffPassword
{
    public sealed class ResetStaffPasswordHandler : IRequestHandler<ResetStaffPasswordRequest, ResetStaffPasswordResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<ResetStaffPasswordHandler> _logger;

        public ResetStaffPasswordHandler(
            UserManager<User> userManager,
            ILogger<ResetStaffPasswordHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<ResetStaffPasswordResponse> Handle(ResetStaffPasswordRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _userManager.Users
                    .Where(u => u.EmployeeId == request.StaffId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (user == null)
                {
                    _logger.LogWarning("User linked to EmployeeId {EmployeeId} not found for password reset", request.StaffId);
                    throw new NoDataFoundException($"User linked to EmployeeId {request.StaffId} not found.");
                }

                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
                if (!result.Succeeded)
                {
                    var message = string.Join("; ", result.Errors.Select(e => e.Description));
                    throw new InvalidOperationException(message);
                }

                return new ResetStaffPasswordResponse(true);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password for staff EmployeeId: {EmployeeId}", request.StaffId);
                throw;
            }
        }
    }
}

