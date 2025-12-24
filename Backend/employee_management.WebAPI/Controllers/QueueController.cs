using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Queues.Commands.Add;
using employee_management.Application.Features.Queues.Commands.ResetDaily;
using employee_management.Application.Features.Queues.Commands.Update;
using employee_management.Application.Features.Queues.Queries.GetByDate;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    public class QueueController : BaseController
    {
        private readonly IMediator _mediator;

        public QueueController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("date/{date}")]
        public async Task<ActionResult<List<GetByDateResponse>>> GetByDate(DateTime date, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetByDateRequest(date), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<AddQueueResponse>> Create(AddQueueRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UpdateQueueResponse>> Update(Guid id, UpdateQueueRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("reset-daily")]
        public async Task<ActionResult<ResetDailyResponse>> ResetDaily([FromQuery] DateTime? date, CancellationToken cancellationToken)
        {
            var targetDate = date ?? DateTime.Today;
            var response = await _mediator.Send(new ResetDailyRequest(targetDate), cancellationToken);
            return Ok(response);
        }
    }
}

