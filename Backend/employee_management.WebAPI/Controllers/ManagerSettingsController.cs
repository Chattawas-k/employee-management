using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Manager.Queries.Settings.GetQueueRules;
using employee_management.Application.Features.Manager.Commands.Settings.UpdateQueueRules;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/manager/settings")]
    [Authorize(Policy = "ManagerOnly")]
    public class ManagerSettingsController : BaseController
    {
        private readonly IMediator _mediator;

        public ManagerSettingsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("queue-rules")]
        public async Task<ActionResult<GetQueueRulesResponse>> GetQueueRules(
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetQueueRulesRequest(), cancellationToken);
            return Ok(response);
        }

        [HttpPut("queue-rules")]
        public async Task<ActionResult<UpdateQueueRulesResponse>> UpdateQueueRules(
            [FromBody] UpdateQueueRulesRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }
    }
}
