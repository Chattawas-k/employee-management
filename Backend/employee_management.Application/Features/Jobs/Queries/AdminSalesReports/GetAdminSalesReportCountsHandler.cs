using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.AdminSalesReports
{
    public sealed class GetAdminSalesReportCountsHandler : IRequestHandler<GetAdminSalesReportCountsRequest, GetAdminSalesReportCountsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly ILogger<GetAdminSalesReportCountsHandler> _logger;

        public GetAdminSalesReportCountsHandler(IJobRepository jobRepository, ILogger<GetAdminSalesReportCountsHandler> logger)
        {
            _jobRepository = jobRepository;
            _logger = logger;
        }

        public async Task<GetAdminSalesReportCountsResponse> Handle(GetAdminSalesReportCountsRequest request, CancellationToken cancellationToken)
        {
            var jobs = await _jobRepository.GetSalesReportsForAdminAsync(
                dateFrom: request.DateFrom,
                dateTo: request.DateTo,
                assigneeId: request.AssigneeId,
                search: request.Search,
                cancellationToken: cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLowerInvariant();
                jobs = jobs.Where(j => MatchesSearch(j, term)).ToList();
            }

            var rejected = 0;
            var success = 0;
            var failed = 0;
            var pending = 0;

            foreach (var job in jobs)
            {
                if (job.Status == JobStatus.Cancelled)
                {
                    rejected++;
                    continue;
                }

                var report = job.Report;
                if (report == null)
                {
                    continue; // not a sales report row
                }

                var s = (report.SalesStatus ?? string.Empty).Trim().ToLowerInvariant();
                if (s == "success")
                    success++;
                else if (s == "failed")
                    failed++;
                else
                    pending++; // default pending for empty/unknown (matches frontend behavior)
            }

            var all = rejected + success + failed + pending;
            return new GetAdminSalesReportCountsResponse(
                All: all,
                Success: success,
                Pending: pending,
                Failed: failed,
                Rejected: rejected);
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
    }
}

