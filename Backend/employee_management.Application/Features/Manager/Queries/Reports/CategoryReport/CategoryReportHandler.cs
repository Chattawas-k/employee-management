using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Reports.CategoryReport
{
    public sealed class CategoryReportHandler : IRequestHandler<CategoryReportRequest, CategoryReportResponse>
    {
        private readonly IJobRepository _jobRepository;

        public CategoryReportHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<CategoryReportResponse> Handle(CategoryReportRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(-30), DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var jobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);
            var jobsWithCategory = jobs.Where(j => !string.IsNullOrEmpty(j.Category)).ToList();

            var categoryGroups = jobsWithCategory.GroupBy(j => j.Category).ToList();
            var categories = new List<CategoryReportItem>();

            foreach (var group in categoryGroups)
            {
                var categoryJobs = group.ToList();
                var totalJobs = categoryJobs.Count;
                var wonJobs = categoryJobs.Where(j => j.Status == JobStatus.ClosedWon).ToList();
                var lostJobs = categoryJobs.Where(j => j.Status == JobStatus.ClosedLost).ToList();
                var wonCount = wonJobs.Count;
                var lostCount = lostJobs.Count;
                var conversionRate = totalJobs > 0 ? (double)wonCount / totalJobs * 100 : 0;

                // Calculate sales
                var totalSales = wonJobs
                    .Where(j => j.Report != null && 
                        j.Report.SalesStatus.ToLower() == "success" &&
                        decimal.TryParse(j.Report.Description, out var amount))
                    .Sum(j => decimal.Parse(j.Report!.Description!));

                var avgDealValue = wonCount > 0 ? totalSales / wonCount : 0;

                // Top performers per category
                var topPerformers = wonJobs
                    .Where(j => j.Employee != null)
                    .GroupBy(j => new { j.AssigneeId, j.Employee!.Name })
                    .Select(g => new CategoryStaffPerformance(
                        g.Key.AssigneeId,
                        g.Key.Name,
                        g.Count(),
                        g.Where(j => j.Report != null && 
                            j.Report.SalesStatus.ToLower() == "success" &&
                            decimal.TryParse(j.Report.Description, out var amount))
                         .Sum(j => decimal.Parse(j.Report!.Description!))
                    ))
                    .OrderByDescending(p => p.SalesAmount)
                    .Take(5)
                    .ToList();

                categories.Add(new CategoryReportItem(
                    group.Key,
                    totalJobs,
                    wonCount,
                    lostCount,
                    conversionRate,
                    totalSales,
                    avgDealValue,
                    topPerformers
                ));
            }

            return new CategoryReportResponse(categories.OrderByDescending(c => c.TotalSales).ToList());
        }
    }
}
