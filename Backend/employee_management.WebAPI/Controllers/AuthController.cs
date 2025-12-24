using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.WebAPI.Controllers.Base;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using employee_management.Application.Features.Auth.LoginFeatures.AzureAd;
using employee_management.Application.Features.Auth.LoginFeatures.Login;
using employee_management.Application.Features.Auth.RefreshTokenFeatures.RefreshToken;
using employee_management.Application.Features.Users.Add;

namespace employee_management.WebAPI.Controllers
{
    public class AuthController : BaseController
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _mediator.Send(request);
            if (response == null)
                return Unauthorized();

            return Ok(response);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] AddUserRequest request)
        {
            var response = await _mediator.Send(request);
            return Ok(response);
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var response = await _mediator.Send(request);
            if (response == null)
                return Unauthorized();
            return Ok(response);
        }

        [HttpPost("azure-ad-login")]
        [AllowAnonymous]
        public async Task<IActionResult> AzureAdLogin([FromBody] AzureAdLoginRequest request)
        {
            var response = await _mediator.Send(request);
            if (response == null)
                return Unauthorized();
            return Ok(response);
        }
    }

    public class AzureAdLoginRequestDto
    {
        public required string AccessToken { get; set; }
    }
}
