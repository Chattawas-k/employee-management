using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetCharts
{
    public sealed class GetChartsHandler : IRequestHandler<GetChartsRequest, GetChartsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IEmployeeRepository _employeeRepository;

        public GetChartsHandler(
            IJobRepository jobRepository,
            IEmployeeRepository employeeRepository)
        {
            _jobRepository = jobRepository;
            _employeeRepository = employeeRepository;
        }

        public async Task<GetChartsResponse> Handle(GetChartsRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(-7), DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);

            // Queue Trend
            var queueTrendPoints = new List<QueueTrendPoint>();
            for (var date = dateFrom.Date; date <= dateTo.Date; date = date.AddDays(1))
            {
                var utcDate = DateTime.SpecifyKind(date, DateTimeKind.Utc);
                var utcDateEnd = DateTime.SpecifyKind(date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                var dayJobs = await _jobRepository.GetJobsByStatusAsync(null, utcDate, utcDateEnd, cancellationToken);
                var created = dayJobs.Count;
                var closed = dayJobs.Count(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost);
                queueTrendPoints.Add(new QueueTrendPoint(date, created, closed));
            }
            var queueTrend = new QueueTrendData(queueTrendPoints);

            // Conversion Funnel
            var allJobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);
            var statusCounts = await _jobRepository.GetStatusCountsAsync(dateFrom, dateTo, cancellationToken);
            var conversionFunnel = new ConversionFunnelData(
                statusCounts.GetValueOrDefault(JobStatus.Pending, 0),
                statusCounts.GetValueOrDefault(JobStatus.Assigned, 0),
                statusCounts.GetValueOrDefault(JobStatus.InProgress, 0),
                statusCounts.GetValueOrDefault(JobStatus.ClosedWon, 0),
                statusCounts.GetValueOrDefault(JobStatus.ClosedLost, 0)
            );

            // Category Mix
            var salesByCategory = await _jobRepository.GetSalesByCategoryAsync(dateFrom, dateTo, cancellationToken);
            
            // Calculate total sales for percentage calculation
            var totalSales = salesByCategory.Values.Sum();
            
            // Get won jobs with ProductCategory included for accurate counting
            var wonJobsForCategoryMix = allJobs
                .Where(j => j.Status == JobStatus.ClosedWon && 
                    j.Report != null && 
                    j.Report.SalesStatus.ToLower() == "success")
                .ToList();
            
            // Create category mix items with count and percentage
            var categoryMixItems = salesByCategory
                .Select(kvp =>
                {
                    var categoryName = kvp.Key;
                    var amount = kvp.Value;
                    
                    // Count jobs for this category (using same logic as GetSalesByCategoryAsync)
                    // Priority: Use JobReport.ProductCategory, fallback to Job.ProductCategoryId or Job.Category
                    var count = wonJobsForCategoryMix.Count(j =>
                    {
                        // Check if category is in JobReport.ProductCategory (comma-separated)
                        if (!string.IsNullOrWhiteSpace(j.Report?.ProductCategory))
                        {
                            var reportCategories = j.Report.ProductCategory
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(c => c.Trim())
                                .Where(c => !string.IsNullOrWhiteSpace(c));
                            if (reportCategories.Contains(categoryName, StringComparer.OrdinalIgnoreCase))
                            {
                                return true;
                            }
                        }
                        
                        // Fallback to Job.ProductCategoryId or Job.Category
                        var fallbackCategory = !string.IsNullOrEmpty(j.ProductCategory?.Name)
                            ? j.ProductCategory.Name
                            : (!string.IsNullOrEmpty(j.Category) ? j.Category : "ไม่ระบุหมวดหมู่");
                        return fallbackCategory == categoryName;
                    });
                    
                    // Calculate percentage
                    var percentage = totalSales > 0 ? (double)(amount / totalSales * 100) : 0;
                    
                    return new CategoryMixItem(categoryName, amount, count);
                })
                .OrderByDescending(item => item.Amount)
                .ToList();
            
            var categoryMix = new CategoryMixData(categoryMixItems);

            // Staff Leaderboard
            var staff = await _employeeRepository.GetStaffWithPerformanceAsync(dateFrom, dateTo, cancellationToken);
            var staffLeaderboardItems = new List<StaffLeaderboardItem>();

            foreach (var employee in staff)
            {
                var employeeJobs = allJobs.Where(j => j.AssigneeId == employee.Id).ToList();
                var wonJobs = employeeJobs.Where(j => j.Status == JobStatus.ClosedWon).ToList();
                var handledJobs = employeeJobs.Where(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost).ToList();
                
                var salesAmount = wonJobs
                    .Where(j => j.Report != null && j.Report.SalesStatus.ToLower() == "success")
                    .Sum(j => j.Report?.Description != null && decimal.TryParse(j.Report.Description, out var amount) ? amount : 0m);
                
                var conversionRate = handledJobs.Count > 0 ? (double)wonJobs.Count / handledJobs.Count * 100 : 0;

                staffLeaderboardItems.Add(new StaffLeaderboardItem(
                    employee.Id,
                    employee.Name,
                    salesAmount,
                    conversionRate,
                    handledJobs.Count
                ));
            }

            var bySales = staffLeaderboardItems.OrderByDescending(s => s.SalesAmount).Take(10).ToList();
            var byConversion = staffLeaderboardItems
                .Where(s => s.HandledCount >= 5) // Minimum 5 handled for conversion rate
                .OrderByDescending(s => s.ConversionRate)
                .Take(10)
                .ToList();

            var staffLeaderboard = new StaffLeaderboardData(bySales, byConversion);

            return new GetChartsResponse(queueTrend, conversionFunnel, categoryMix, staffLeaderboard);
        }
    }
}
