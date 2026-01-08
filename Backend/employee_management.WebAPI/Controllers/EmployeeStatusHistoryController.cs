using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.EmployeeStatusHistory.Queries.GetHistory;
using employee_management.Domain.Enums;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/employee-status-history")]
    [Authorize(Policy = "AdminOnly")]
    public class EmployeeStatusHistoryController : BaseController
    {
        private readonly IMediator _mediator;

        public EmployeeStatusHistoryController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<GetHistoryResponse>> GetHistory(
            [FromQuery] Guid? employeeId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? changeReason = null,
            CancellationToken cancellationToken = default)
        {
            ChangeReason? changeReasonEnum = null;
            if (changeReason.HasValue)
            {
                changeReasonEnum = (ChangeReason)changeReason.Value;
            }

            var request = new GetHistoryRequest(employeeId, startDate, endDate, changeReasonEnum);
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }
    }
}

