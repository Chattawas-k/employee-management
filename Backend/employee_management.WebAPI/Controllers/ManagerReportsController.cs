using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Manager.Queries.Reports.QueuePerformance;
using employee_management.Application.Features.Manager.Queries.Reports.StaffPerformance;
using employee_management.Application.Features.Manager.Queries.Reports.CategoryReport;
using employee_management.Application.Features.Manager.Queries.Reports.LostReasons;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/manager/reports")]
    [Authorize(Policy = "ManagerOnly")]
    public class ManagerReportsController : BaseController
    {
        private readonly IMediator _mediator;

        public ManagerReportsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("queue-performance")]
        public async Task<ActionResult<QueuePerformanceResponse>> GetQueuePerformance(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new QueuePerformanceRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }

        [HttpGet("staff-performance")]
        public async Task<ActionResult<StaffPerformanceResponse>> GetStaffPerformance(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new StaffPerformanceRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }

        [HttpGet("category")]
        public async Task<ActionResult<CategoryReportResponse>> GetCategoryReport(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new CategoryReportRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }

        [HttpGet("lost-reasons")]
        public async Task<ActionResult<LostReasonsResponse>> GetLostReasons(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new LostReasonsRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }
    }
}
