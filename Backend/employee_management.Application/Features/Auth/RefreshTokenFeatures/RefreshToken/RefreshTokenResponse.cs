using System;
using System.Collections.Generic;
using System.Text;

namespace employee_management.Application.Features.Auth.RefreshTokenFeatures.RefreshToken
{
    public class RefreshTokenResponse
    {
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
    }
}
