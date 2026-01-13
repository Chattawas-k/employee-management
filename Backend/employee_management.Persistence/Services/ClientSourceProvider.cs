using employee_management.Application.Common.Services;
using employee_management.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace employee_management.Persistence.Services
{
    public sealed class ClientSourceProvider : IClientSourceProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ClientSourceProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public StatusChangeSource GetSource()
        {
            var http = _httpContextAccessor.HttpContext;
            if (http == null)
            {
                return StatusChangeSource.Unknown;
            }

            if (http.Request.Headers.TryGetValue("X-Client-Source", out var raw))
            {
                var value = raw.ToString().Trim().ToUpperInvariant();
                if (value == "MOBILE") return StatusChangeSource.Mobile;
                if (value == "WEB") return StatusChangeSource.Web;
            }

            // Default for normal HTTP requests
            return StatusChangeSource.Web;
        }
    }
}

