using MediatR;
using employee_management.Application.Common.Services;

namespace employee_management.Application.Features.Auth.RefreshTokenFeatures.RefreshToken
{
 public class RefreshTokenHandler : IRequestHandler<RefreshTokenRequest, RefreshTokenResponse>
 {
 private readonly ILoginService _loginService;

 public RefreshTokenHandler(ILoginService loginService)
 {
 _loginService = loginService;
 }

 public async Task<RefreshTokenResponse> Handle(RefreshTokenRequest request, CancellationToken cancellationToken)
 {
 return await _loginService.RefreshTokenAsync(request);
 }
 }
}
