using MediatR;
using employee_management.Application.Common.Services;
using employee_management.Application.Features.Auth.LoginFeatures.Login;

namespace employee_management.Application.Features.Auth.LoginFeatures.AzureAd
{
 public class AzureAdLoginHandler : IRequestHandler<AzureAdLoginRequest, LoginResponse>
 {
 private readonly ILoginService _loginService;

 public AzureAdLoginHandler(ILoginService loginService)
 {
 _loginService = loginService;
 }

 public async Task<LoginResponse> Handle(AzureAdLoginRequest request, CancellationToken cancellationToken)
 {
 return await _loginService.AzureAdLoginAsync(request.AccessToken);
 }
 }
}
