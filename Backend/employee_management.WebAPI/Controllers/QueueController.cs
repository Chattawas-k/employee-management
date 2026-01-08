using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Queues.Commands.Add;
using employee_management.Application.Features.Queues.Commands.Archive;
using employee_management.Application.Features.Queues.Commands.BulkUpdate;
using employee_management.Application.Features.Queues.Commands.Delete;
using employee_management.Application.Features.Queues.Commands.ResetDaily;
using employee_management.Application.Features.Queues.Commands.Update;
using employee_management.Application.Features.Queues.Commands.UpdateMyStatus;
using employee_management.Application.Features.Queues.Queries.GetByDate;
using employee_management.Application.Features.Queues.Queries.GetMyQueueInfo;
using employee_management.Domain.Enums;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    public class QueueController : BaseController
    {
        private readonly IMediator _mediator;

        public QueueController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("date/{date}")]
        public async Task<ActionResult<List<GetByDateResponse>>> GetByDate(DateTime date, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetByDateRequest(date), cancellationToken);
            return Ok(response);
        }

        [HttpGet("my-info")]
        public async Task<ActionResult<GetMyQueueInfoResponse>> GetMyQueueInfo(CancellationToken cancellationToken)
        {
            // Get EmployeeId from JWT token claims
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId))
            {
                return BadRequest("EmployeeId not found in token or invalid format.");
            }

            var request = new GetMyQueueInfoRequest(employeeId);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<AddQueueResponse>> Create(AddQueueRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UpdateQueueResponse>> Update(Guid id, UpdateQueueRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("reset-daily")]
        public async Task<ActionResult<ResetDailyResponse>> ResetDaily([FromQuery] DateTime? date, CancellationToken cancellationToken)
        {
            var targetDate = date ?? DateTime.Today;
            var response = await _mediator.Send(new ResetDailyRequest(targetDate), cancellationToken);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            await _mediator.Send(new DeleteRequest(id), cancellationToken);
            return NoContent();
        }

        [HttpPut("bulk-update")]
        public async Task<ActionResult<BulkUpdateResponse>> BulkUpdate(
            [FromBody] BulkUpdateRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("archive")]
        public async Task<ActionResult<ArchiveResponse>> Archive(
            [FromBody] ArchiveRequestDto request,
            CancellationToken cancellationToken)
        {
            var archiveRequest = new ArchiveRequest(
                request.SourceDate,
                request.TargetDate
            );
            var response = await _mediator.Send(archiveRequest, cancellationToken);
            return Ok(response);
        }

        [HttpPut("my-status")]
        public async Task<ActionResult<UpdateMyQueueStatusResponse>> UpdateMyStatus(
            [FromBody] UpdateMyQueueStatusRequestDto request,
            CancellationToken cancellationToken)
        {
            // Get EmployeeId from JWT token claims
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId))
            {
                return BadRequest("EmployeeId not found in token or invalid format.");
            }

            // Map string status to QueueStatus enum
            QueueStatus queueStatus = request.Status.ToLower() switch
            {
                "active" => QueueStatus.Active,
                "busy" => QueueStatus.Busy,
                "inactive" => QueueStatus.Inactive,
                _ => throw new ArgumentException($"Invalid status: {request.Status}")
            };

            var requestWithEmployeeId = new UpdateMyQueueStatusRequest(employeeId, queueStatus);
            var response = await _mediator.Send(requestWithEmployeeId, cancellationToken);
            return Ok(response);
        }

        public sealed record UpdateMyQueueStatusRequestDto(string Status);
        public sealed record ArchiveRequestDto(DateTime SourceDate, DateTime? TargetDate = null);
    }
}

