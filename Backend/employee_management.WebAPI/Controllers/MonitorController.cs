using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Monitor.Queries.GetMonitorSnapshot;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/monitor")]
    public sealed class MonitorController : ControllerBase
    {
        private readonly IMediator _mediator;

        public MonitorController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Public monitor snapshot (no auth). Intended for TV/front-desk display.
        /// </summary>
        [HttpGet("snapshot")]
        [AllowAnonymous]
        public async Task<ActionResult<GetMonitorSnapshotResponse>> GetSnapshot(
            [FromQuery] DateTime? date,
            CancellationToken cancellationToken)
        {
            var targetDate = (date ?? DateTime.Today).Date;
            var response = await _mediator.Send(new GetMonitorSnapshotRequest(targetDate), cancellationToken);
            return Ok(response);
        }
    }
}

