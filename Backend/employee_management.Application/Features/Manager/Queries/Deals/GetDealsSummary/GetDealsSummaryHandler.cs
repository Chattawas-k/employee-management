using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Common.Helpers;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Deals.GetDealsSummary
{
    public sealed class GetDealsSummaryHandler : IRequestHandler<GetDealsSummaryRequest, GetDealsSummaryResponse>
    {
        private readonly IJobRepository _jobRepository;

        public GetDealsSummaryHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<GetDealsSummaryResponse> Handle(GetDealsSummaryRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var jobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);
            var wonJobs = jobs.Where(j => j.Status == JobStatus.ClosedWon).ToList();
            var handledJobs = jobs.Where(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost).ToList();

            var totalSales = wonJobs
                .Where(j => j.Report != null && j.Report.SalesStatus.ToLower() == "success")
                .Sum(j => SalesAmountHelper.ExtractSalesAmount(j.Report?.Description));

            var avgDeal = wonJobs.Count > 0 ? totalSales / wonJobs.Count : 0m;
            var conversionRate = handledJobs.Count > 0 ? (double)wonJobs.Count / handledJobs.Count * 100 : 0;

            // Top Staff
            var topStaff = wonJobs
                .GroupBy(j => j.Employee?.Name ?? "Unknown")
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key ?? "N/A";

            // Top Category
            var topCategory = wonJobs
                .Where(j => !string.IsNullOrEmpty(j.Category))
                .GroupBy(j => j.Category)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key ?? "N/A";

            return new GetDealsSummaryResponse(totalSales, avgDeal, conversionRate, topStaff, topCategory);
        }
    }
}
