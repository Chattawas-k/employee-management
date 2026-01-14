using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Common.Models;
using employee_management.Application.Features.Employees.Commands.Add;
using employee_management.Application.Features.Employees.Commands.Delete;
using employee_management.Application.Features.Employees.Commands.Update;
using employee_management.Application.Features.Employees.Queries.Get;
using employee_management.Application.Features.Employees.Queries.Search;
using employee_management.Application.Features.Employees.Queries.DropdownList;
using employee_management.Application.Features.Employees.Queries.GetMyWorkStats;
using employee_management.Application.Features.Employees.Commands.UpdateMyAvatar;
using employee_management.WebAPI.Controllers.Base;
using employee_management.Domain.Enums;

namespace employee_management.WebAPI.Controllers
{
    public class EmployeeController : BaseController
    {
        private readonly IMediator _mediator;

        public EmployeeController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeGetResponse>> Get(Guid id, CancellationToken cancellationToken)
        {
            if (id == Guid.Empty)
            {
                return BadRequest("Employee ID cannot be empty.");
            }
            var response = await _mediator.Send(new GetRequest(id), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<AddResponse>> Create(AddRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UpdateResponse>> Update(Guid id, [FromBody] UpdateRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            await _mediator.Send(new DeleteRequest(id), cancellationToken);
            return NoContent();
        }

        [HttpGet("search")]
        public async Task<ActionResult<PaginatedList<SearchResponse>>> Search([FromQuery] SearchRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("dropdown-list")]
        public async Task<ActionResult<List<DropdownListResponse>>> GetDropdownList(
            [FromQuery] EmployeeStatus? status = null,
            [FromQuery] Guid? departmentId = null,
            [FromQuery] Guid? positionId = null,
            CancellationToken cancellationToken = default)
        {
            var request = new DropdownListRequest(status, departmentId, positionId);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("me")]
        public async Task<ActionResult<EmployeeGetResponse>> GetMyEmployeeInfo(CancellationToken cancellationToken)
        {
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            var response = await _mediator.Send(new GetRequest(employeeId), cancellationToken);
            return Ok(response);
        }

        [HttpGet("my-work-stats")]
        public async Task<ActionResult<GetMyWorkStatsResponse>> GetMyWorkStats(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken cancellationToken)
        {
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            var request = new GetMyWorkStatsRequest(employeeId, startDate, endDate);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("me/avatar")]
        public async Task<ActionResult<UpdateMyAvatarResponse>> UploadMyAvatar(
            [FromForm] IFormFile file,
            CancellationToken cancellationToken)
        {
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("File is required.");
            }

            const long maxBytes = 2 * 1024 * 1024; // 2MB
            if (file.Length > maxBytes)
            {
                return BadRequest("File is too large. Max 2MB.");
            }

            var contentType = (file.ContentType ?? string.Empty).ToLowerInvariant();
            if (contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp")
            {
                return BadRequest("Unsupported image type. Allowed: image/jpeg, image/png, image/webp");
            }

            byte[] bytes;
            using (var ms = new MemoryStream())
            {
                await file.CopyToAsync(ms, cancellationToken);
                bytes = ms.ToArray();
            }

            var base64 = Convert.ToBase64String(bytes);
            var dataUrl = $"data:{contentType};base64,{base64}";

            var response = await _mediator.Send(new UpdateMyAvatarRequest(employeeId, dataUrl), cancellationToken);
            return Ok(response);
        }

        [HttpDelete("me/avatar")]
        public async Task<ActionResult<UpdateMyAvatarResponse>> DeleteMyAvatar(CancellationToken cancellationToken)
        {
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            var response = await _mediator.Send(new UpdateMyAvatarRequest(employeeId, null), cancellationToken);
            return Ok(response);
        }
    }
}

