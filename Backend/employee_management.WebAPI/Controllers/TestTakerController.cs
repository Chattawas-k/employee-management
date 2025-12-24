using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Common.Models;
using employee_management.Application.Features.TestTakers.Commands.Add;
using employee_management.Application.Features.TestTakers.Commands.Delete;
using employee_management.Application.Features.TestTakers.Commands.Update;
using employee_management.Application.Features.TestTakers.Queries.Get;
using employee_management.Application.Features.TestTakers.Queries.Search;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{

    public class TestTakerController : BaseController
    {
        private readonly IMediator _mediator;

        public TestTakerController(IMediator mediator)
        {
            _mediator = mediator;
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<GetTestTakerResponse>> Get(Guid id, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetRequest(id), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<AddTestTakerResponse>> Create(AddTestTakerRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UpdateTestTakerResponse>> Update(Guid id, UpdateTestTakerRequest request,
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
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            await _mediator.Send(new DeleteRequest(id), cancellationToken);
            return NoContent();
        }

        [HttpGet("search")]
        public async Task<ActionResult<PaginatedList<SearchTestTakerResponse>>> Search([FromQuery] SearchRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }
    }
}
