using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace employee_management.WebAPI.Services
{
    public interface IPasswordLinkTokenStore
    {
        PasswordLinkToken Create(Guid userId, string type, TimeSpan ttl);
        PasswordLinkValidationResult Validate(string token);
        bool TryMarkUsed(string token, out PasswordLinkToken? tokenInfo);
    }

    public sealed record PasswordLinkToken(
        Guid UserId,
        string Type,
        DateTimeOffset ExpiresAt,
        bool Used,
        DateTimeOffset? UsedAt
    );

    public sealed record PasswordLinkValidationResult(
        bool Valid,
        string? Reason,
        DateTimeOffset? ExpiresAt
    );

    public sealed class PasswordLinkTokenStore : IPasswordLinkTokenStore
    {
        private const string CacheKeyPrefix = "pwdlink:";
        private static readonly TimeSpan RetentionAfterExpiry = TimeSpan.FromHours(24);

        private readonly IMemoryCache _cache;
        private readonly TimeProvider _timeProvider;

        public PasswordLinkTokenStore(IMemoryCache cache, TimeProvider timeProvider)
        {
            _cache = cache;
            _timeProvider = timeProvider;
        }

        public PasswordLinkToken Create(Guid userId, string type, TimeSpan ttl)
        {
            var now = _timeProvider.GetUtcNow();
            var token = GenerateToken();
            var expiresAt = now.Add(ttl);
            var info = new PasswordLinkToken(userId, type, expiresAt, Used: false, UsedAt: null);

            // Keep record for a bit after expiry so UI can distinguish invalid vs expired/used.
            var cacheTtl = ttl + RetentionAfterExpiry;
            _cache.Set(GetCacheKey(token), info, cacheTtl);

            // Return token in-memory only to caller; we do not store raw token.
            return info with { Type = $"{type}|{token}" };
        }

        public PasswordLinkValidationResult Validate(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return new PasswordLinkValidationResult(false, "invalid", null);
            }

            if (!_cache.TryGetValue(GetCacheKey(token), out PasswordLinkToken? info) || info == null)
            {
                return new PasswordLinkValidationResult(false, "invalid", null);
            }

            var now = _timeProvider.GetUtcNow();
            if (info.Used)
            {
                return new PasswordLinkValidationResult(false, "used", info.ExpiresAt);
            }

            if (now > info.ExpiresAt)
            {
                return new PasswordLinkValidationResult(false, "expired", info.ExpiresAt);
            }

            return new PasswordLinkValidationResult(true, null, info.ExpiresAt);
        }

        public bool TryMarkUsed(string token, out PasswordLinkToken? tokenInfo)
        {
            tokenInfo = null;
            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            var key = GetCacheKey(token);
            if (!_cache.TryGetValue(key, out PasswordLinkToken? info) || info == null)
            {
                return false;
            }

            var now = _timeProvider.GetUtcNow();
            if (info.Used || now > info.ExpiresAt)
            {
                tokenInfo = info;
                return false;
            }

            tokenInfo = info with { Used = true, UsedAt = now };

            // Preserve remaining cache duration by re-setting with remaining time (expiry+retention - now)
            var remaining = (info.ExpiresAt + RetentionAfterExpiry) - now;
            if (remaining < TimeSpan.FromMinutes(1))
            {
                remaining = TimeSpan.FromMinutes(1);
            }

            _cache.Set(key, tokenInfo, remaining);
            return true;
        }

        private static string GenerateToken()
        {
            // 32 bytes random => ~43 chars base64url
            Span<byte> bytes = stackalloc byte[32];
            RandomNumberGenerator.Fill(bytes);
            return Base64UrlEncode(bytes);
        }

        private static string GetCacheKey(string token)
        {
            var hash = Sha256Hex(token);
            return CacheKeyPrefix + hash;
        }

        private static string Sha256Hex(string input)
        {
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = SHA256.HashData(bytes);
            var sb = new StringBuilder(hash.Length * 2);
            foreach (var b in hash)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }

        private static string Base64UrlEncode(ReadOnlySpan<byte> bytes)
        {
            var base64 = Convert.ToBase64String(bytes);
            return base64.Replace("+", "-").Replace("/", "_").TrimEnd('=');
        }
    }
}

