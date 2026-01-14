using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;
using employee_management.WebAPI.Controllers.Base;
using employee_management.WebAPI.Services;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    [AllowAnonymous]
    public sealed class AuthPasswordLinkController : BaseController
    {
        private readonly IPasswordLinkTokenStore _tokenStore;
        private readonly UserManager<User> _userManager;

        public AuthPasswordLinkController(
            IPasswordLinkTokenStore tokenStore,
            UserManager<User> userManager)
        {
            _tokenStore = tokenStore;
            _userManager = userManager;
        }

        [HttpGet("password-link/validate")]
        public ActionResult Validate([FromQuery] string token)
        {
            var result = _tokenStore.Validate(token);
            return Ok(new
            {
                valid = result.Valid,
                reason = result.Reason,
                expiresAt = result.ExpiresAt
            });
        }

        [HttpPost("set-password")]
        public async Task<IActionResult> SetPassword([FromBody] SetPasswordByTokenBody body)
        {
            if (string.IsNullOrWhiteSpace(body.Token))
            {
                return BadRequest(new { success = false, code = "PASSWORD_POLICY", message = "Token is required." });
            }

            if (string.IsNullOrWhiteSpace(body.NewPassword) || string.IsNullOrWhiteSpace(body.ConfirmPassword))
            {
                return BadRequest(new { success = false, code = "PASSWORD_POLICY", message = "Password is required." });
            }

            if (!string.Equals(body.NewPassword, body.ConfirmPassword, StringComparison.Ordinal))
            {
                return BadRequest(new { success = false, code = "PASSWORD_POLICY", message = "ยืนยันรหัสผ่านไม่ตรงกัน" });
            }

            var validation = _tokenStore.Validate(body.Token);
            if (!validation.Valid)
            {
                // Map to required code
                return StatusCode(StatusCodes.Status410Gone, new
                {
                    success = false,
                    code = "TOKEN_EXPIRED_OR_USED",
                    message = "ลิงก์หมดอายุหรือถูกใช้งานแล้ว"
                });
            }

            // Mark used (single-use) before performing password reset to prevent race.
            if (!_tokenStore.TryMarkUsed(body.Token, out var tokenInfo) || tokenInfo == null)
            {
                return StatusCode(StatusCodes.Status410Gone, new
                {
                    success = false,
                    code = "TOKEN_EXPIRED_OR_USED",
                    message = "ลิงก์หมดอายุหรือถูกใช้งานแล้ว"
                });
            }

            var user = await _userManager.FindByIdAsync(tokenInfo.UserId.ToString());
            if (user == null)
            {
                return StatusCode(StatusCodes.Status410Gone, new
                {
                    success = false,
                    code = "TOKEN_EXPIRED_OR_USED",
                    message = "ลิงก์หมดอายุหรือถูกใช้งานแล้ว"
                });
            }

            // Must not match current password
            if (await _userManager.CheckPasswordAsync(user, body.NewPassword))
            {
                return Conflict(new
                {
                    success = false,
                    code = "PASSWORD_SAME_AS_OLD",
                    message = "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม"
                });
            }

            // Validate password policy via Identity validators
            var validators = _userManager.PasswordValidators;
            foreach (var validator in validators)
            {
                var result = await validator.ValidateAsync(_userManager, user, body.NewPassword);
                if (!result.Succeeded)
                {
                    var message = string.Join("; ", result.Errors.Select(e => e.Description));
                    return BadRequest(new
                    {
                        success = false,
                        code = "PASSWORD_POLICY",
                        message
                    });
                }
            }

            // Reset password (admin-style) using Identity reset token
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, body.NewPassword);
            if (!resetResult.Succeeded)
            {
                var message = string.Join("; ", resetResult.Errors.Select(e => e.Description));
                return BadRequest(new
                {
                    success = false,
                    code = "PASSWORD_POLICY",
                    message
                });
            }

            return Ok(new { success = true });
        }
    }

    public sealed record SetPasswordByTokenBody(
        string Token,
        string NewPassword,
        string ConfirmPassword
    );
}

