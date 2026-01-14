using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace employee_management.Application.Features.Jobs.Queries.ExportMySalesReports
{
    public sealed class ExportMySalesReportsHandler : IRequestHandler<ExportMySalesReportsRequest, ExportMySalesReportsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly ILogger<ExportMySalesReportsHandler> _logger;

        public ExportMySalesReportsHandler(IJobRepository jobRepository, ILogger<ExportMySalesReportsHandler> logger)
        {
            _jobRepository = jobRepository;
            _logger = logger;
        }

        public async Task<ExportMySalesReportsResponse> Handle(ExportMySalesReportsRequest request, CancellationToken cancellationToken)
        {
            var jobs = await _jobRepository.GetMyJobsForSalesReportExportAsync(request.EmployeeId, cancellationToken);
            _logger.LogInformation("ExportMySalesReports: loaded {Count} jobs for EmployeeId {EmployeeId}", jobs.Count, request.EmployeeId);

            var rows = new List<ExportSalesReportRowDto>(jobs.Count);
            var statusLogs = new List<ExportStatusLogRowDto>();

            foreach (var job in jobs)
            {
                var report = job.Report;
                var reportJsonRaw = job.ReportJson;

                var salesStatus = string.Empty;
                if (job.Status == JobStatus.Cancelled)
                {
                    salesStatus = "rejected";
                }
                else if (report != null && !string.IsNullOrWhiteSpace(report.SalesStatus))
                {
                    salesStatus = report.SalesStatus.Trim().ToLowerInvariant();
                }

                var customerName = report?.CustomerName;
                if (string.IsNullOrWhiteSpace(customerName))
                {
                    customerName = job.Customer;
                }

                var statusLogsList = job.StatusLogs ?? new List<StatusLog>();
                foreach (var log in statusLogsList)
                {
                    statusLogs.Add(new ExportStatusLogRowDto
                    {
                        JobId = job.Id,
                        JobNumber = job.JobNumber,
                        Status = log.Status ?? string.Empty,
                        Timestamp = log.Timestamp
                    });
                }

                var saleDate = DeriveSaleDate(job, statusLogsList);

                rows.Add(new ExportSalesReportRowDto
                {
                    JobId = job.Id,
                    JobNumber = job.JobNumber,
                    JobRunningCode = job.JobRunningCode,
                    Title = job.Title,
                    CustomerOriginal = job.Customer,
                    Channel = job.Channel,
                    Priority = job.Priority,
                    JobStatus = job.Status,
                    IsEscalated = job.IsEscalated,
                    ProductCategoryId = job.ProductCategoryId,
                    ProductCategoryName = job.ProductCategory?.Name,
                    AssigneeId = job.AssigneeId,
                    AssigneeName = job.Employee?.Name,

                    CreatedAt = job.CreatedDate,
                    AssignedAt = job.AssignedDate,
                    StartedAt = job.StartedDate,
                    ClosedAt = job.ClosedDate,
                    SlaWaitingBreachAt = job.SlaWaitingBreachAt,
                    SlaAssignedBreachAt = job.SlaAssignedBreachAt,
                    SaleDateDerived = saleDate,

                    CustomerName = customerName ?? string.Empty,
                    CustomerContact = report?.CustomerContact ?? string.Empty,
                    SalesStatus = salesStatus,
                    Reasons = report?.Reasons ?? new List<string>(),
                    ProductCategoryReport = report?.ProductCategory ?? string.Empty,
                    DescriptionReport = report?.Description ?? string.Empty,

                    StatusLogsSummary = SummarizeStatusLogs(statusLogsList),
                    ReportJsonRaw = reportJsonRaw
                });
            }

            return new ExportMySalesReportsResponse(rows, statusLogs);
        }

        private static DateTimeOffset? DeriveSaleDate(Job job, List<StatusLog> logs)
        {
            if (logs == null || logs.Count == 0)
                return null;

            if (job.Status != JobStatus.ClosedWon && job.Status != JobStatus.ClosedLost)
                return null;

            var closeLog = logs
                .Where(l => string.Equals(l.Status, "ClosedWon", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(l.Status, "ClosedLost", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(l => l.Timestamp)
                .FirstOrDefault();

            return closeLog?.Timestamp;
        }

        private static string SummarizeStatusLogs(List<StatusLog> logs)
        {
            if (logs == null || logs.Count == 0)
                return string.Empty;

            var parts = logs
                .OrderBy(l => l.Timestamp)
                .Select(l => $"{l.Status}@{l.Timestamp:O}");

            return string.Join("; ", parts);
        }
    }
}

