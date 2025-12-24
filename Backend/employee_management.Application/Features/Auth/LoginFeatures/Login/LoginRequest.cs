using System;
using System.Collections.Generic;
using System.Text;
using MediatR;

namespace employee_management.Application.Features.Auth.LoginFeatures.Login
{
    public class LoginRequest : IRequest<LoginResponse>
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}
