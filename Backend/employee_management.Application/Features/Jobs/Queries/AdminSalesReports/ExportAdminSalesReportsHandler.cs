using employee_management.Application.Features.Jobs.Queries.ExportMySalesReports;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.AdminSalesReports
{
    public sealed class ExportAdminSalesReportsHandler : IRequestHandler<ExportAdminSalesReportsRequest, ExportMySalesReportsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly ILogger<ExportAdminSalesReportsHandler> _logger;

        public ExportAdminSalesReportsHandler(IJobRepository jobRepository, ILogger<ExportAdminSalesReportsHandler> logger)
        {
            _jobRepository = jobRepository;
            _logger = logger;
        }

        public async Task<ExportMySalesReportsResponse> Handle(ExportAdminSalesReportsRequest request, CancellationToken cancellationToken)
        {
            var jobs = await _jobRepository.GetSalesReportsForAdminExportAsync(
                dateFrom: request.DateFrom,
                dateTo: request.DateTo,
                assigneeId: request.AssigneeId,
                search: request.Search,
                cancellationToken: cancellationToken);

            var filtered = FilterByStatusAndSearch(jobs, request.Status, request.Search)
                .OrderByDescending(j => j.CreatedDate)
                .ToList();

            _logger.LogInformation("ExportAdminSalesReports: exporting {Count} jobs (after filters)", filtered.Count);

            var rows = new List<ExportSalesReportRowDto>(filtered.Count);
            var statusLogs = new List<ExportStatusLogRowDto>();

            foreach (var job in filtered)
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

                    ClosedByAdminName = report?.ClosedByAdminName,
                    SaleValueDerived = salesStatus == "success"
                        ? ExtractSaleValue(report?.Description)
                        : null,

                    StatusLogsSummary = SummarizeStatusLogs(statusLogsList),
                    ReportJsonRaw = reportJsonRaw
                });
            }

            return new ExportMySalesReportsResponse(rows, statusLogs);
        }

        private static List<Job> FilterByStatusAndSearch(List<Job> jobs, string? status, string? search)
        {
            var statusLower = status?.Trim().ToLowerInvariant();
            var isRejected = statusLower is "rejected" or "cancelled";

            IEnumerable<Job> q = jobs;

            if (isRejected)
            {
                q = q.Where(j => j.Status == JobStatus.Cancelled);
            }
            else if (string.IsNullOrWhiteSpace(statusLower))
            {
                q = q.Where(j => j.Status == JobStatus.Cancelled || (j.ReportJson != null && j.Report != null));
            }
            else
            {
                q = q.Where(j =>
                    j.ReportJson != null &&
                    j.Report != null &&
                    !string.IsNullOrWhiteSpace(j.Report.SalesStatus) &&
                    j.Report.SalesStatus.Trim().ToLowerInvariant() == statusLower);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                q = q.Where(j => MatchesSearch(j, term));
            }

            return q.ToList();
        }

        private static bool MatchesSearch(Job job, string termLower)
        {
            bool Contains(string? s) => !string.IsNullOrWhiteSpace(s) && s.ToLowerInvariant().Contains(termLower);

            if (Contains(job.JobNumber) || Contains(job.JobRunningCode) || Contains(job.Title) || Contains(job.Customer))
                return true;

            if (Contains(job.Employee?.Name))
                return true;

            var report = job.Report;
            if (report != null)
            {
                if (Contains(report.CustomerName) || Contains(report.CustomerContact) || Contains(report.SalesStatus) ||
                    Contains(report.ProductCategory) || Contains(report.Description))
                {
                    return true;
                }

                if (report.Reasons != null && report.Reasons.Any(r => Contains(r)))
                    return true;
            }

            if (Contains(job.ProductCategory?.Name))
                return true;

            return false;
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

        /// <summary>
        /// Extracts the numeric sale value from the description field.
        /// Handles formats: "5000", "5000 | หมายเหตุ", "5000, หมายเหตุ"
        /// </summary>
        private static decimal? ExtractSaleValue(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return null;

            var desc = description.Trim();

            // Pure number
            if (decimal.TryParse(desc, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var direct) && direct > 0)
                return direct;

            // "number | rest" or "number, rest"
            foreach (var sep in new[] { "|", ",", ";", "\n", "\r" })
            {
                var idx = desc.IndexOf(sep, StringComparison.Ordinal);
                if (idx > 0)
                {
                    var before = desc[..idx].Trim();
                    if (decimal.TryParse(before, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var num) && num > 0)
                        return num;
                }
            }

            return null;
        }
    }
}

