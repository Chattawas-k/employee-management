using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Jobs.Queries.GetActiveJobs;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/admin/active-jobs")]
    [Authorize(Policy = "AdminOnly")]
    public class AdminActiveJobsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AdminActiveJobsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<GetActiveJobsResponse>> GetActiveJobs(
            [FromQuery] Guid? assigneeId = null,
            [FromQuery] string? search = null,
            CancellationToken cancellationToken = default)
        {
            var response = await _mediator.Send(new GetActiveJobsRequest
            {
                AssigneeId = assigneeId,
                Search = search
            }, cancellationToken);

            return Ok(response);
        }
    }
}
