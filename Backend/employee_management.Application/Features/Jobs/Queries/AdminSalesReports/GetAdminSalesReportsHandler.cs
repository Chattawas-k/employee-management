using AutoMapper;
using employee_management.Application.Features.Jobs.Queries.GetSalesReports;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.AdminSalesReports
{
    public sealed class GetAdminSalesReportsHandler : IRequestHandler<GetAdminSalesReportsRequest, GetSalesReportsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetAdminSalesReportsHandler> _logger;

        public GetAdminSalesReportsHandler(IJobRepository jobRepository, IMapper mapper, ILogger<GetAdminSalesReportsHandler> logger)
        {
            _jobRepository = jobRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<GetSalesReportsResponse> Handle(GetAdminSalesReportsRequest request, CancellationToken cancellationToken)
        {
            var jobs = await _jobRepository.GetSalesReportsForAdminAsync(
                dateFrom: request.DateFrom,
                dateTo: request.DateTo,
                assigneeId: request.AssigneeId,
                search: request.Search,
                cancellationToken: cancellationToken);

            var filtered = FilterByStatusAndSearch(jobs, request.Status, request.Search);

            filtered = filtered
                .OrderByDescending(j => j.CreatedDate)
                .ToList();

            filtered = ApplyPaging(filtered, request.PageNumber, request.PageSize);

            var dtos = _mapper.Map<List<SalesReportDto>>(filtered);
            return new GetSalesReportsResponse(dtos);
        }

        private static List<Job> ApplyPaging(List<Job> jobs, int? pageNumber, int? pageSize)
        {
            if (!pageNumber.HasValue || !pageSize.HasValue || pageNumber.Value <= 0 || pageSize.Value <= 0)
            {
                return jobs;
            }

            var skip = (pageNumber.Value - 1) * pageSize.Value;
            return jobs.Skip(skip).Take(pageSize.Value).ToList();
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
                // All = jobs with a report OR cancelled jobs, but keep only rows that deserialize to report + cancelled
                q = q.Where(j => j.Status == JobStatus.Cancelled || (j.ReportJson != null && j.Report != null));
            }
            else
            {
                // Report-based statuses: pending/success/failed
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
    }
}

