using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Manager.Queries.Deals.GetDeals;
using employee_management.Application.Features.Manager.Queries.Deals.GetDealsSummary;
using employee_management.Application.Features.Manager.Queries.Deals.GetLostReasons;
using employee_management.Domain.Enums;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/manager/deals")]
    [Authorize(Policy = "ManagerOnly")]
    public class ManagerDealsController : BaseController
    {
        private readonly IMediator _mediator;

        public ManagerDealsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<GetDealsResponse>> GetDeals(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] Guid? staffId,
            [FromQuery] string? category,
            [FromQuery] string? channel,
            [FromQuery] JobStatus? outcome,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetDealsRequest(dateFrom, dateTo, staffId, category, channel, outcome), cancellationToken);
            return Ok(response);
        }

        [HttpGet("summary")]
        public async Task<ActionResult<GetDealsSummaryResponse>> GetDealsSummary(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetDealsSummaryRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }

        [HttpGet("lost-reasons")]
        public async Task<ActionResult> GetLostReasons(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var request = new GetLostReasonsRequest(dateFrom, dateTo);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }
    }
}
