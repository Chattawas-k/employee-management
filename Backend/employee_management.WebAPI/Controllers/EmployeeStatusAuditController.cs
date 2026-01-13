using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.WebAPI.Controllers.Base;
using employee_management.Application.Features.EmployeeStatusAudit.Queries.GetDailyAuditList;
using employee_management.Application.Features.EmployeeStatusAudit.Queries.GetEmployeeDailyAudit;
using employee_management.Domain.Enums;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/employee-status-audit")]
    [Authorize(Policy = "AdminOnly")]
    public sealed class EmployeeStatusAuditController : BaseController
    {
        private readonly IMediator _mediator;

        public EmployeeStatusAuditController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("daily")]
        public async Task<ActionResult<employee_management.Application.Features.EmployeeStatusAudit.Models.DailyAuditListResponse>> GetDaily(
            [FromQuery] DateTime date,
            [FromQuery] string? search = null,
            [FromQuery] AvailabilityStatus[]? statuses = null,
            [FromQuery] StatusActorType? actorType = null,
            [FromQuery] string[]? anomalies = null,
            [FromQuery] string? sort = null,
            CancellationToken cancellationToken = default)
        {
            var req = new GetDailyAuditListRequest(date, search, statuses, actorType, anomalies, sort);
            var res = await _mediator.Send(req, cancellationToken);
            return Ok(res);
        }

        [HttpGet("{employeeId:guid}/daily")]
        public async Task<ActionResult<employee_management.Application.Features.EmployeeStatusAudit.Models.EmployeeDailyAuditResponse>> GetEmployeeDaily(
            [FromRoute] Guid employeeId,
            [FromQuery] DateTime date,
            [FromQuery] AvailabilityStatus[]? statuses = null,
            [FromQuery] StatusActorType? actorType = null,
            [FromQuery] bool onlyAnomaly = false,
            CancellationToken cancellationToken = default)
        {
            var req = new GetEmployeeDailyAuditRequest(employeeId, date, statuses, actorType, onlyAnomaly);
            var res = await _mediator.Send(req, cancellationToken);
            return Ok(res);
        }
    }
}

