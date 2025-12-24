using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Jobs.Commands.Create;
using employee_management.Application.Features.Jobs.Commands.UpdateStatus;
using employee_management.Application.Features.Jobs.Queries.Get;
using employee_management.Application.Features.Jobs.Queries.GetMyTasks;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/job")]
    [Authorize]
    public class JobController : BaseController
    {
        private readonly IMediator _mediator;

        public JobController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("my-tasks/{employeeId}")]
        public async Task<ActionResult<GetMyTasksResponse>> GetMyTasks(Guid employeeId, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetMyTasksRequest(employeeId), cancellationToken);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobGetResponse>> Get(Guid id, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetRequest(id), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<CreateResponse>> Create([FromBody] CreateRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<UpdateStatusResponse>> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }
    }
}

