using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Manager.Queries.Dashboard.GetKpis;
using employee_management.Application.Features.Manager.Queries.Dashboard.GetQueueSnapshot;
using employee_management.Application.Features.Manager.Queries.Dashboard.GetStaffSnapshot;
using employee_management.Application.Features.Manager.Queries.Dashboard.GetCharts;
using employee_management.Application.Features.Manager.Queries.Dashboard.GetAlerts;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/manager/dashboard")]
    [Authorize(Policy = "ManagerOnly")]
    public class ManagerDashboardController : BaseController
    {
        private readonly IMediator _mediator;

        public ManagerDashboardController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("kpis")]
        public async Task<ActionResult<GetKpisResponse>> GetKpis(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetKpisRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }

        [HttpGet("queue-snapshot")]
        public async Task<ActionResult<GetQueueSnapshotResponse>> GetQueueSnapshot(
            [FromQuery] int topCount = 10,
            CancellationToken cancellationToken = default)
        {
            var response = await _mediator.Send(new GetQueueSnapshotRequest(topCount), cancellationToken);
            return Ok(response);
        }

        [HttpGet("staff-snapshot")]
        public async Task<ActionResult<GetStaffSnapshotResponse>> GetStaffSnapshot(
            CancellationToken cancellationToken = default)
        {
            var response = await _mediator.Send(new GetStaffSnapshotRequest(), cancellationToken);
            return Ok(response);
        }

        [HttpGet("charts")]
        public async Task<ActionResult<GetChartsResponse>> GetCharts(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken = default)
        {
            var response = await _mediator.Send(new GetChartsRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }

        [HttpGet("alerts")]
        public async Task<ActionResult<GetAlertsResponse>> GetAlerts(
            CancellationToken cancellationToken = default)
        {
            var response = await _mediator.Send(new GetAlertsRequest(), cancellationToken);
            return Ok(response);
        }
    }
}
