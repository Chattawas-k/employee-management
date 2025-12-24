using System;
using System.Collections.Generic;
using System.Text;
using MediatR;

namespace employee_management.Application.Features.Auth.RefreshTokenFeatures.RefreshToken
{
    public class RefreshTokenRequest : IRequest<RefreshTokenResponse>
    {
        public required string RefreshToken { get; set; }
    }
}
