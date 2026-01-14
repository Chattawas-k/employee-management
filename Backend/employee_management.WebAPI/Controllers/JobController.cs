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
using employee_management.Application.Features.Jobs.Queries.ExportMySalesReports;
using employee_management.WebAPI.Controllers.Base;
using employee_management.Domain.Enums;
using ClosedXML.Excel;
using System.Globalization;

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

        [HttpGet("sales-reports/export")]
        public async Task<IActionResult> ExportMySalesReports(CancellationToken cancellationToken)
        {
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim) || !Guid.TryParse(employeeIdClaim, out var employeeId) || employeeId == Guid.Empty)
            {
                return BadRequest("EmployeeId not found in token, invalid format, or not linked to this user.");
            }

            var response = await _mediator.Send(new ExportMySalesReportsRequest(employeeId), cancellationToken);

            var tz = GetBangkokTimeZone();
            var nowBkk = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, tz);
            var fileName = $"sales-report_my_{nowBkk:yyyy-MM-dd_HH-mm}_bkk.xlsx";

            using var workbook = new XLWorkbook();

            // Sheet 1: SalesReport
            var ws = workbook.Worksheets.Add("SalesReport");
            var headers = new[]
            {
                // Job
                "JobId","JobNumber","JobRunningCode","Title","Customer(Original)","Channel","Priority","JobStatus","IsEscalated",
                "ProductCategoryId","ProductCategoryName","AssigneeId","AssigneeName",
                // Time (Bangkok)
                "CreatedAt(BKK)","AssignedAt(BKK)","StartedAt(BKK)","ClosedAt(BKK)","SlaWaitingBreachAt(BKK)","SlaAssignedBreachAt(BKK)","SaleDateDerived(BKK)",
                // Sales report
                "CustomerName","CustomerContact","SalesStatus","Reasons","ProductCategory(Report)","Description(Report)",
                // Debug
                "StatusLogs"
            };

            for (var i = 0; i < headers.Length; i++)
            {
                ws.Cell(1, i + 1).Value = headers[i];
            }
            ws.Row(1).Style.Font.Bold = true;
            ws.SheetView.FreezeRows(1);
            ws.Range(1, 1, 1, headers.Length).SetAutoFilter();

            var dtFormat = "yyyy-mm-dd hh:mm:ss";

            for (var r = 0; r < response.Rows.Count; r++)
            {
                var row = response.Rows[r];
                var excelRow = r + 2;
                var c = 1;

                // Job
                ws.Cell(excelRow, c++).Value = row.JobId.ToString();
                ws.Cell(excelRow, c++).Value = row.JobNumber;
                ws.Cell(excelRow, c++).Value = row.JobRunningCode ?? string.Empty;
                ws.Cell(excelRow, c++).Value = row.Title;
                ws.Cell(excelRow, c++).Value = row.CustomerOriginal;
                ws.Cell(excelRow, c++).Value = row.Channel;
                ws.Cell(excelRow, c++).Value = row.Priority.ToString();
                ws.Cell(excelRow, c++).Value = row.JobStatus.ToString();
                ws.Cell(excelRow, c++).Value = row.IsEscalated ? "true" : "false";
                ws.Cell(excelRow, c++).Value = row.ProductCategoryId?.ToString() ?? string.Empty;
                ws.Cell(excelRow, c++).Value = row.ProductCategoryName ?? string.Empty;
                ws.Cell(excelRow, c++).Value = row.AssigneeId.ToString();
                ws.Cell(excelRow, c++).Value = row.AssigneeName ?? string.Empty;

                // Time (Bangkok)
                SetDateTimeCell(ws.Cell(excelRow, c++), ToBangkok(row.CreatedAt, tz), dtFormat);
                SetDateTimeCell(ws.Cell(excelRow, c++), ToBangkok(row.AssignedAt, tz), dtFormat);
                SetDateTimeCell(ws.Cell(excelRow, c++), ToBangkok(row.StartedAt, tz), dtFormat);
                SetDateTimeCell(ws.Cell(excelRow, c++), ToBangkok(row.ClosedAt, tz), dtFormat);
                SetDateTimeCell(ws.Cell(excelRow, c++), ToBangkok(row.SlaWaitingBreachAt, tz), dtFormat);
                SetDateTimeCell(ws.Cell(excelRow, c++), ToBangkok(row.SlaAssignedBreachAt, tz), dtFormat);
                SetDateTimeCell(ws.Cell(excelRow, c++), ToBangkok(row.SaleDateDerived, tz), dtFormat);

                // Sales report
                ws.Cell(excelRow, c++).Value = row.CustomerName;
                ws.Cell(excelRow, c++).Value = row.CustomerContact;
                ws.Cell(excelRow, c++).Value = row.SalesStatus;
                ws.Cell(excelRow, c++).Value = string.Join(", ", row.Reasons ?? new List<string>());
                ws.Cell(excelRow, c++).Value = row.ProductCategoryReport;
                ws.Cell(excelRow, c++).Value = row.DescriptionReport;

                // Debug
                ws.Cell(excelRow, c++).Value = row.StatusLogsSummary;
            }

            ws.Columns().AdjustToContents(1, headers.Length);

            // Sheet 2: StatusLogs
            var ws2 = workbook.Worksheets.Add("StatusLogs");
            ws2.Cell(1, 1).Value = "JobId";
            ws2.Cell(1, 2).Value = "JobNumber";
            ws2.Cell(1, 3).Value = "Status";
            ws2.Cell(1, 4).Value = "Timestamp(BKK)";
            ws2.Row(1).Style.Font.Bold = true;
            ws2.SheetView.FreezeRows(1);
            ws2.Range(1, 1, 1, 4).SetAutoFilter();

            for (var i = 0; i < response.StatusLogs.Count; i++)
            {
                var log = response.StatusLogs[i];
                var excelRow = i + 2;
                ws2.Cell(excelRow, 1).Value = log.JobId.ToString();
                ws2.Cell(excelRow, 2).Value = log.JobNumber;
                ws2.Cell(excelRow, 3).Value = log.Status;
                SetDateTimeCell(ws2.Cell(excelRow, 4), ToBangkok(log.Timestamp, tz), dtFormat);
            }

            ws2.Columns().AdjustToContents(1, 4);

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            var bytes = ms.ToArray();

            Response.Headers["Content-Disposition"] = $"attachment; filename=\"{fileName}\"";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }

        private static TimeZoneInfo GetBangkokTimeZone()
        {
            // Linux/macOS: "Asia/Bangkok", Windows: "SE Asia Standard Time"
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok");
            }
            catch
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
        }

        private static DateTime? ToBangkok(DateTimeOffset? utcValue, TimeZoneInfo tz)
        {
            if (!utcValue.HasValue) return null;
            var bkk = TimeZoneInfo.ConvertTime(utcValue.Value, tz);
            return bkk.DateTime;
        }

        private static DateTime? ToBangkok(DateTimeOffset utcValue, TimeZoneInfo tz)
        {
            var bkk = TimeZoneInfo.ConvertTime(utcValue, tz);
            return bkk.DateTime;
        }

        private static DateTime? ToBangkok(DateTime? utcValue, TimeZoneInfo tz)
        {
            if (!utcValue.HasValue) return null;
            var dt = utcValue.Value;
            if (dt.Kind == DateTimeKind.Unspecified)
            {
                dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }
            var dto = new DateTimeOffset(dt.ToUniversalTime(), TimeSpan.Zero);
            var bkk = TimeZoneInfo.ConvertTime(dto, tz);
            return bkk.DateTime;
        }

        private static void SetDateTimeCell(IXLCell cell, DateTime? value, string numberFormat)
        {
            if (!value.HasValue) return;
            cell.Value = value.Value;
            cell.Style.DateFormat.Format = numberFormat;
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

