using System;
using System.Collections.Generic;
using System.Text;

namespace employee_management.Application.Features.Auth.LoginFeatures.Login
{
    public class LoginResponse
    {
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public string? UserName { get; set; }
        public IList<string>? Roles { get; set; }
    }
}
