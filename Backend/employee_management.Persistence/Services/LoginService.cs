using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using employee_management.Application.Common.Services;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net.Http;
using System.Text.Json;
using employee_management.Application.Features.Auth.LoginFeatures.Login;
using employee_management.Application.Features.Auth.RefreshTokenFeatures.RefreshToken;

namespace employee_management.Persistence.Services
{
    public class LoginService : ILoginService
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;

        public LoginService(
            UserManager<User> userManager,
            IConfiguration configuration,
            ApplicationDbContext dbContext,
            IHttpClientFactory httpClientFactory)
        {
            _userManager = userManager;
            _configuration = configuration;
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
                throw new InvalidOperationException("Invalid login credentials.");

            var roles = await GetUserRolesAsync(user);

            if (roles == null || roles.Count == 0)
                throw new InvalidOperationException("Roles could not be retrieved.");

            var token = GenerateJwtToken(user, roles);

            // Generate and store refresh token
            var refreshToken = GenerateRefreshToken(user);
            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            _dbContext.RefreshTokens.Add(refreshTokenEntity);
            await _dbContext.SaveChangesAsync();

            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                UserName = user.UserName,
                Roles = roles
            };
        }

        public async Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            // Note: Cannot use IsActive computed property in EF Core query
            // Must check the actual database columns: Revoked == null && DateTime.UtcNow < Expires
            var refreshTokenEntity = await _dbContext.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken 
                                        && rt.Revoked == null 
                                        && rt.Expires > DateTime.UtcNow);

            if (refreshTokenEntity == null || refreshTokenEntity.User == null)
                throw new InvalidOperationException("Invalid refresh token.");

            var user = refreshTokenEntity.User;
            var roles = await GetUserRolesAsync(user);

            if (roles == null || roles.Any(role => role == null))
                throw new InvalidOperationException("Roles could not be retrieved.");

            var newJwt = GenerateJwtToken(user, roles);
            var newRefreshToken = GenerateRefreshToken(user);

            // Revoke old token and add new one
            refreshTokenEntity.Revoked = DateTime.UtcNow;
            var newRefreshTokenEntity = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            _dbContext.RefreshTokens.Add(newRefreshTokenEntity);
            await _dbContext.SaveChangesAsync();

            return new RefreshTokenResponse
            {
                Token = newJwt,
                RefreshToken = newRefreshToken
            };
        }

        public async Task<User> FindOrCreateExternalUserAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user != null)
                return user;

            // Create a new user with a random username
            var newUser = new User
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };
            var result = await _userManager.CreateAsync(newUser);
            if (!result.Succeeded)
                throw new InvalidOperationException("Failed to create external user.");

            return newUser;
        }

        public async Task<IList<string>> GetUserRolesAsync(User user)
        {
            // Use UserManager if possible, otherwise query the db
            var roles = await _dbContext.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Join(_dbContext.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name!)
                .ToListAsync();

            return roles;
        }

        public string GenerateJwtToken(User user, IList<string> roles)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var keyString = jwtSettings["Key"];

            if (string.IsNullOrEmpty(keyString))
            {
                throw new InvalidOperationException("JWT key is not configured.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new Claim(ClaimTypes.Name, user.UserName ?? "")
            };

            // Add EmployeeId to claims if user is linked to an employee
            if (user.EmployeeId.HasValue)
            {
                claims.Add(new Claim("EmployeeId", user.EmployeeId.Value.ToString()));
            }

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpiresInMinutes"] ?? "60")),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken(User user)
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        }

        public async Task<ClaimsPrincipal?> ValidateAzureAdTokenAsync(string accessToken)
        {
            var tenantId = _configuration["AzureAd:TenantId"];
            if (string.IsNullOrEmpty(tenantId))
            {
                throw new InvalidOperationException("AzureAd TenantId is not configured.");
            }

            var audience = _configuration["AzureAd:ClientId"];
            var issuer = $"https://sts.windows.net/{tenantId}/";

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = await GetAzureAdSigningKeysAsync(tenantId)
            };

            var handler = new JwtSecurityTokenHandler();
            try
            {
                SecurityToken validatedToken;
                var principal = handler.ValidateToken(accessToken, tokenValidationParameters, out validatedToken);
                return principal;
            }
            catch
            {
                return null;
            }
        }

        private async Task<IEnumerable<SecurityKey>> GetAzureAdSigningKeysAsync(string tenantId)
        {
            // Fetch Azure AD OpenID Connect metadata document
            var client = _httpClientFactory.CreateClient();
            var metadataUrl = $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration";
            var metadataResponse = await client.GetStringAsync(metadataUrl);
            using var doc = JsonDocument.Parse(metadataResponse);
            var jwksUri = doc.RootElement.GetProperty("jwks_uri").GetString();

            var keysResponse = await client.GetStringAsync(jwksUri!);
            using var keysDoc = JsonDocument.Parse(keysResponse);
            var keys = new List<SecurityKey>();

            foreach (var keyElement in keysDoc.RootElement.GetProperty("keys").EnumerateArray())
            {
                var kty = keyElement.GetProperty("kty").GetString();
                if (kty == "RSA")
                {
                    var e = keyElement.GetProperty("e").GetString();
                    var n = keyElement.GetProperty("n").GetString();
                    var key = new RsaSecurityKey(
                        new System.Security.Cryptography.RSAParameters
                        {
                            Exponent = Base64UrlEncoder.DecodeBytes(e),
                            Modulus = Base64UrlEncoder.DecodeBytes(n)
                        }
                    );
                    keys.Add(key);
                }
            }
            return keys;
        }

        public async Task<LoginResponse> AzureAdLoginAsync(string accessToken)
        {
            var principal = await ValidateAzureAdTokenAsync(accessToken);
            if (principal == null)
                throw new InvalidOperationException("Invalid Azure AD token.");

            var email = principal.FindFirst(ClaimTypes.Email)?.Value ?? principal.FindFirst("preferred_username")?.Value;
            if (string.IsNullOrEmpty(email))
                throw new InvalidOperationException("Email claim not found in Azure AD token.");

            var user = await FindOrCreateExternalUserAsync(email);
            var roles = await GetUserRolesAsync(user);

            var token = GenerateJwtToken(user, roles);
            var refreshToken = GenerateRefreshToken(user);

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            _dbContext.RefreshTokens.Add(refreshTokenEntity);
            await _dbContext.SaveChangesAsync();

            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                UserName = user.UserName,
                Roles = roles
            };
        }
    }
}