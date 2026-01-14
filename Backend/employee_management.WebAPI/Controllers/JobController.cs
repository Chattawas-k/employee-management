using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Jobs.Commands.Create;
using employee_management.Application.Features.Jobs.Commands.UpdateStatus;
using employee_management.Application.Features.Jobs.Queries.Get;
using employee_management.Application.Features.Jobs.Queries.GetMyTasks;
using employee_management.Application.Features.Jobs.Queries.GetMyStatusHistory;
using employee_management.Application.Features.Jobs.Queries.GetSalesReports;
using employee_management.Application.Features.Jobs.Queries.GetQueueSummary;
using employee_management.Application.Features.Jobs.Queries.GetWaitingJobs;
using employee_management.WebAPI.Controllers.Base;
using employee_management.Domain.Enums;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/job")]
    [Authorize]
    public class JobController : BaseController
    {
        private readonly IMediator _mediator;

        public JobController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("my-tasks")]
        public async Task<ActionResult<GetMyTasksResponse>> GetMyTasks(CancellationToken cancellationToken)
        {
            // Get EmployeeId from JWT token claims
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            var response = await _mediator.Send(new GetMyTasksRequest(employeeId), cancellationToken);
            return Ok(response);
        }

        [HttpGet("my-status-history")]
        public async Task<ActionResult<GetMyStatusHistoryResponse>> GetMyStatusHistory(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? source = null,
            [FromQuery] Guid? jobId = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50,
            CancellationToken cancellationToken = default)
        {
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            JobChangeSource? changeSource = null;
            if (source.HasValue)
            {
                if (!Enum.IsDefined(typeof(JobChangeSource), source.Value))
                {
                    return BadRequest("Invalid source.");
                }
                changeSource = (JobChangeSource)source.Value;
            }

            var response = await _mediator.Send(
                new GetMyStatusHistoryRequest(employeeId, startDate, endDate, changeSource, jobId, skip, take),
                cancellationToken);

            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobGetResponse>> Get(Guid id, CancellationToken cancellationToken)
        {
            // Validate that id is not empty GUID
            if (id == Guid.Empty)
            {
                return BadRequest("Job ID cannot be empty.");
            }

            var response = await _mediator.Send(new GetRequest(id), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<CreateResponse>> Create([FromBody] CreateRequest request, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<UpdateStatusResponse>> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken cancellationToken)
        {
            // Validate that id is not empty GUID
            if (id == Guid.Empty)
            {
                return BadRequest("Job ID cannot be empty.");
            }

            if (id != request.Id)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("waiting")]
        public async Task<ActionResult<GetWaitingJobsResponse>> GetWaitingJobs(CancellationToken cancellationToken)
        {
            var request = new GetWaitingJobsRequest();
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("sales-reports")]
        public async Task<ActionResult<GetSalesReportsResponse>> GetSalesReports(
            [FromQuery] string? status = null,
            [FromQuery] int? pageNumber = null,
            [FromQuery] int? pageSize = null,
            CancellationToken cancellationToken = default)
        {
            // Get EmployeeId from JWT token claims
            // This is the employee who is assigned to the job, not the creator
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            var response = await _mediator.Send(new GetSalesReportsRequest(employeeId, status, pageNumber, pageSize), cancellationToken);
            return Ok(response);
        }

        [HttpGet("queue-summary")]
        public async Task<ActionResult<GetQueueSummaryResponse>> GetQueueSummary(
            [FromQuery] DateTime? date = null,
            CancellationToken cancellationToken = default)
        {
            var targetDate = date ?? DateTime.Today;
            var response = await _mediator.Send(new GetQueueSummaryRequest(targetDate), cancellationToken);
            return Ok(response);
        }
    }
}

