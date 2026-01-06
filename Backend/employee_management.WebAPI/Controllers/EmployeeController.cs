using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Common.Models;
using employee_management.Application.Features.Employees.Commands.Add;
using employee_management.Application.Features.Employees.Commands.Delete;
using employee_management.Application.Features.Employees.Commands.Update;
using employee_management.Application.Features.Employees.Queries.Get;
using employee_management.Application.Features.Employees.Queries.Search;
using employee_management.Application.Features.Employees.Queries.DropdownList;
using employee_management.Application.Features.Employees.Queries.GetJobAssignmentList;
using employee_management.WebAPI.Controllers.Base;
using employee_management.Domain.Enums;

namespace employee_management.WebAPI.Controllers
{
    public class EmployeeController : BaseController
    {
        private readonly IMediator _mediator;

        public EmployeeController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeGetResponse>> Get(Guid id, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetRequest(id), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<AddResponse>> Create(AddRequest request, CancellationToken cancellationToken)
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
            await _mediator.Send(new DeleteRequest(id), cancellationToken);
            return NoContent();
        }

        [HttpGet("search")]
        public async Task<ActionResult<PaginatedList<SearchResponse>>> Search([FromQuery] SearchRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("dropdown-list")]
        public async Task<ActionResult<List<DropdownListResponse>>> GetDropdownList(
            [FromQuery] EmployeeStatus? status = null,
            [FromQuery] Guid? departmentId = null,
            [FromQuery] Guid? positionId = null,
            CancellationToken cancellationToken = default)
        {
            var request = new DropdownListRequest(status, departmentId, positionId);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("job-assignment-list")]
        public async Task<ActionResult<List<GetJobAssignmentListResponse>>> GetJobAssignmentList(
            [FromQuery] string? keyword = null,
            CancellationToken cancellationToken = default)
        {
            var request = new GetJobAssignmentListRequest(keyword);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }
    }
}

