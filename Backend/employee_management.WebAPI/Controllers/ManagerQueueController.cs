using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Manager.Commands.Queue.ForceAssign;
using employee_management.Application.Features.Manager.Commands.Queue.Transfer;
using employee_management.Application.Features.Manager.Commands.Queue.Escalate;
using employee_management.Application.Features.Manager.Commands.Queue.Cancel;
using employee_management.Application.Features.Jobs.Queries.Get;
using employee_management.Application.Features.Manager.Queries.Queue.GetTickets;
using employee_management.Domain.Enums;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/manager/queue")]
    [Authorize(Policy = "ManagerOnly")]
    public class ManagerQueueController : BaseController
    {
        private readonly IMediator _mediator;

        public ManagerQueueController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("tickets")]
        public async Task<ActionResult> GetTickets(
            [FromQuery] JobStatus? status,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] string? channel,
            [FromQuery] string? category,
            [FromQuery] Guid? assignedStaffId,
            [FromQuery] bool? isSlaAtRisk,
            [FromQuery] bool? isEscalated,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken cancellationToken = default)
        {
            var request = new GetTicketsRequest(
                status,
                dateFrom,
                dateTo,
                channel,
                category,
                assignedStaffId,
                isSlaAtRisk,
                isEscalated,
                pageNumber,
                pageSize
            );
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("tickets/{id}")]
        public async Task<ActionResult<JobGetResponse>> GetTicket(
            Guid id,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetRequest(id), cancellationToken);
            return Ok(response);
        }

        [HttpPost("tickets/{id}/force-assign")]
        public async Task<ActionResult<ForceAssignResponse>> ForceAssign(
            Guid id,
            [FromBody] ForceAssignRequest request,
            CancellationToken cancellationToken)
        {
            if (id != request.JobId)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }

            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("tickets/{id}/transfer")]
        public async Task<ActionResult<TransferResponse>> Transfer(
            Guid id,
            [FromBody] TransferRequest request,
            CancellationToken cancellationToken)
        {
            if (id != request.JobId)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }

            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("tickets/{id}/escalate")]
        public async Task<ActionResult<EscalateResponse>> Escalate(
            Guid id,
            [FromBody] EscalateRequest request,
            CancellationToken cancellationToken)
        {
            if (id != request.JobId)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }

            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("tickets/{id}/cancel")]
        public async Task<ActionResult<CancelResponse>> Cancel(
            Guid id,
            [FromBody] CancelRequest request,
            CancellationToken cancellationToken)
        {
            if (id != request.JobId)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }

            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }
    }
}
