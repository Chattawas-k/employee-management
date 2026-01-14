using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.SalesReasons.Commands;
using employee_management.Application.Features.SalesReasons.Commands.Create;
using employee_management.Application.Features.SalesReasons.Commands.Delete;
using employee_management.Application.Features.SalesReasons.Commands.Update;
using employee_management.Application.Features.SalesReasons.Queries.GetList;
using employee_management.Domain.Enums;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/sales-reasons")]
    [Authorize]
    public class SalesReasonController : BaseController
    {
        private readonly IMediator _mediator;

        public SalesReasonController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<GetSalesReasonsResponse>> Get(
            [FromQuery] string type,
            [FromQuery] bool includeInactive = false,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(type))
            {
                return BadRequest("type is required.");
            }

            if (includeInactive && !(User.IsInRole("Admin") || User.IsInRole("SuperAdmin")))
            {
                return Forbid();
            }

            if (!TryParseType(type, out var reasonType))
            {
                return BadRequest("Invalid type. Allowed: pendingDecision, failedClose");
            }

            var response = await _mediator.Send(new GetSalesReasonsRequest(reasonType, includeInactive), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<SalesReasonUpsertResponse>> Create(
            [FromBody] CreateSalesReasonRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<SalesReasonUpsertResponse>> Update(
            Guid id,
            [FromBody] UpdateSalesReasonRequest request,
            CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            await _mediator.Send(new DeleteSalesReasonRequest(id), cancellationToken);
            return NoContent();
        }

        private static bool TryParseType(string type, out SalesReasonType result)
        {
            var normalized = type.Trim().ToLowerInvariant();
            if (normalized is "pendingdecision" or "pending_decision" or "pending-decision")
            {
                result = SalesReasonType.PendingDecision;
                return true;
            }
            if (normalized is "failedclose" or "failed_close" or "failed-close")
            {
                result = SalesReasonType.FailedClose;
                return true;
            }
            result = default;
            return false;
        }
    }
}

