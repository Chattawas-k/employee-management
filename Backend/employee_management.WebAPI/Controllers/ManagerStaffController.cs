using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Manager.Queries.Staff.GetStaff;
using employee_management.Application.Features.Manager.Queries.Staff.GetStaffDetail;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/manager/staff")]
    [Authorize(Policy = "ManagerOnly")]
    public class ManagerStaffController : BaseController
    {
        private readonly IMediator _mediator;

        public ManagerStaffController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<GetStaffResponse>> GetStaff(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetStaffRequest(dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }

        [HttpGet("{id}/detail")]
        public async Task<ActionResult<GetStaffDetailResponse>> GetStaffDetail(
            Guid id,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetStaffDetailRequest(id, dateFrom, dateTo), cancellationToken);
            return Ok(response);
        }
    }
}
