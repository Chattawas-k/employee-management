using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Admin.Staff.Commands.CreateStaff;
using employee_management.Application.Features.Admin.Staff.Commands.ResetStaffPassword;
using employee_management.Application.Features.Admin.Staff.Commands.SetStaffStatus;
using employee_management.Application.Features.Admin.Staff.Commands.SetStaffAvailabilityStatus;
using employee_management.Application.Features.Admin.Staff.Commands.SetStaffRole;
using employee_management.Application.Features.Admin.Staff.Commands.UpdateStaffProfile;
using employee_management.Application.Features.Admin.Staff.Queries.GetStaffList;
using employee_management.WebAPI.Controllers.Base;
using employee_management.Domain.Entities;
using employee_management.WebAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/admin/staff")]
    [Authorize(Policy = "AdminOnly")]
    public sealed class AdminStaffController : BaseController
    {
        private readonly IMediator _mediator;
        private readonly UserManager<User> _userManager;
        private readonly IPasswordLinkTokenStore _tokenStore;

        public AdminStaffController(
            IMediator mediator,
            UserManager<User> userManager,
            IPasswordLinkTokenStore tokenStore)
        {
            _mediator = mediator;
            _userManager = userManager;
            _tokenStore = tokenStore;
        }

        [HttpGet]
        public async Task<ActionResult<GetStaffListResponse>> GetStaff(
            [FromQuery] bool basicOnly = false,
            CancellationToken cancellationToken = default)
        {
            // Admin users are always limited to basic-only; SuperAdmin can choose via query.
            var enforcedBasicOnly = basicOnly || !User.IsInRole("SuperAdmin");
            var response = await _mediator.Send(new GetStaffListRequest(enforcedBasicOnly), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<CreateStaffResponse>> CreateStaff(
            [FromBody] CreateStaffRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{staffId:guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<UpdateStaffProfileResponse>> UpdateStaffProfile(
            Guid staffId,
            [FromBody] UpdateStaffProfileBody body,
            CancellationToken cancellationToken)
        {
            var request = new UpdateStaffProfileRequest(
                StaffId: staffId,
                FullName: body.FullName,
                PositionId: body.PositionId,
                ProfileImageDataUrl: body.ProfileImageDataUrl,
                RemoveProfileImage: body.RemoveProfileImage
            );

            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{staffId:guid}/status")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<SetStaffStatusResponse>> SetStatus(
            Guid staffId,
            [FromBody] SetStaffStatusBody body,
            CancellationToken cancellationToken)
        {
            var request = new SetStaffStatusRequest(staffId, body.IsActive);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{staffId:guid}/availability-status")]
        public async Task<ActionResult<SetStaffAvailabilityStatusResponse>> SetAvailabilityStatus(
            Guid staffId,
            [FromBody] SetStaffAvailabilityStatusBody body,
            CancellationToken cancellationToken)
        {
            // Get actor EmployeeId from JWT token claims
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var actorEmployeeId) || actorEmployeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            var request = new SetStaffAvailabilityStatusRequest(
                StaffId: staffId,
                Status: body.Status,
                ChangedByEmployeeId: actorEmployeeId);

            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{staffId:guid}/role")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<SetStaffRoleResponse>> SetRole(
            Guid staffId,
            [FromBody] SetStaffRoleBody body,
            CancellationToken cancellationToken)
        {
            var request = new SetStaffRoleRequest(staffId, body.Role);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("{staffId:guid}/reset-password")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<ResetStaffPasswordResponse>> ResetPassword(
            Guid staffId,
            [FromBody] ResetStaffPasswordBody body,
            CancellationToken cancellationToken)
        {
            var request = new ResetStaffPasswordRequest(staffId, body.NewPassword);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("{staffId:guid}/password-link")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GeneratePasswordLink(
            Guid staffId,
            [FromBody] GeneratePasswordLinkBody body,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(body.Type) || (body.Type != "invite" && body.Type != "reset"))
            {
                return BadRequest("type must be 'invite' or 'reset'.");
            }

            var user = await _userManager.Users
                .Where(u => u.EmployeeId == staffId)
                .FirstOrDefaultAsync(cancellationToken);

            if (user == null)
            {
                return NotFound();
            }

            var ttl = TimeSpan.FromMinutes(30);
            var tokenInfo = _tokenStore.Create(user.Id, body.Type, ttl);

            // token is encoded in Type field as "type|token" (internal detail)
            var parts = tokenInfo.Type.Split('|', 2);
            var token = parts.Length == 2 ? parts[1] : string.Empty;

            var origin = Request.Headers.Origin.ToString();
            var baseUrl = !string.IsNullOrWhiteSpace(origin)
                ? origin
                : $"{Request.Scheme}://{Request.Host}";

            var linkUrl = $"{baseUrl}/auth/set-password?token={Uri.EscapeDataString(token)}";

            return Ok(new
            {
                linkUrl,
                expiresAt = tokenInfo.ExpiresAt,
                ttlMinutes = 30
            });
        }
    }

    public sealed record UpdateStaffProfileBody(
        string FullName,
        Guid PositionId,
        string? ProfileImageDataUrl,
        bool RemoveProfileImage
    );

    public sealed record SetStaffStatusBody(
        bool IsActive
    );

    public sealed record SetStaffRoleBody(
        string Role
    );

    public sealed record ResetStaffPasswordBody(
        string NewPassword
    );

    public sealed record GeneratePasswordLinkBody(
        string Type
    );

    public sealed record SetStaffAvailabilityStatusBody(
        string Status
    );
}

