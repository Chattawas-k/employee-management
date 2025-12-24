using employee_management.Application.Features.Auth.LoginFeatures.Login;
using employee_management.Application.Features.Auth.RefreshTokenFeatures.RefreshToken;
using employee_management.Domain.Entities;
using System.Security.Claims;

namespace employee_management.Application.Common.Services
{
    public interface ILoginService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request);

        Task<User> FindOrCreateExternalUserAsync(string email);
        Task<IList<string>> GetUserRolesAsync(User user);
        string GenerateJwtToken(User user, IList<string> roles);
        string GenerateRefreshToken(User user);

        Task<ClaimsPrincipal?> ValidateAzureAdTokenAsync(string accessToken);
        Task<LoginResponse> AzureAdLoginAsync(string accessToken);
    }
}
