using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Positions.Queries.GetAll;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
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
    }
}

