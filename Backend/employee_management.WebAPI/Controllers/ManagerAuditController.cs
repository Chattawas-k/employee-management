using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Manager.Queries.Audit.GetAuditLog;
using employee_management.Domain.Enums;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/manager/audit")]
    [Authorize(Policy = "ManagerOnly")]
    public class ManagerAuditController : BaseController
    {
        private readonly IMediator _mediator;

        public ManagerAuditController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<GetAuditLogResponse>> GetAuditLog(
            [FromQuery] Guid? actorId,
            [FromQuery] AuditActionType? actionType,
            [FromQuery] string? entityType,
            [FromQuery] Guid? entityId,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken cancellationToken = default)
        {
            var response = await _mediator.Send(new GetAuditLogRequest(
                actorId, actionType, entityType, entityId, dateFrom, dateTo, pageNumber, pageSize), cancellationToken);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetAuditLogDetail(
            Guid id,
            CancellationToken cancellationToken)
        {
            // TODO: Implement audit log detail
            return Ok(new { message = "Not implemented yet" });
        }
    }
}
