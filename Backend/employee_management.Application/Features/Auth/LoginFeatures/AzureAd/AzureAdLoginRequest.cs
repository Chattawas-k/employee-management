using MediatR;
using employee_management.Application.Features.Auth.LoginFeatures.Login;

namespace employee_management.Application.Features.Auth.LoginFeatures.AzureAd
{
 public class AzureAdLoginRequest : IRequest<LoginResponse>
 {
 public required string AccessToken { get; set; }
 }
}
