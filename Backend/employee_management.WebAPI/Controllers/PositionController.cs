using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Positions.Queries.GetAll;
using employee_management.Application.Features.Positions.Commands.Add;
using employee_management.Application.Features.Positions.Commands.Update;
using employee_management.Application.Features.Positions.Commands.Delete;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/position")]
    public class PositionController : BaseController
    {
        private readonly IMediator _mediator;

        public PositionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<GetAllPositionsResponse>>> GetAll([FromQuery] Guid? departmentId, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetAllRequest(departmentId), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<AddResponse>> Create([FromBody] AddRequest request, CancellationToken cancellationToken)
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
            await _mediator.Send(new DeleteRequest { Id = id }, cancellationToken);
            return NoContent();
        }
    }
}

