using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Common.Helpers;
using employee_management.Domain.Enums;
using System.Text.Json;
using employee_management.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Queries.GetMyWorkStats
{
    public sealed class GetMyWorkStatsHandler : IRequestHandler<GetMyWorkStatsRequest, GetMyWorkStatsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly ILogger<GetMyWorkStatsHandler> _logger;

        public GetMyWorkStatsHandler(IJobRepository jobRepository, ILogger<GetMyWorkStatsHandler> logger)
        {
            _jobRepository = jobRepository;
            _logger = logger;
        }

        public async Task<GetMyWorkStatsResponse> Handle(GetMyWorkStatsRequest request, CancellationToken cancellationToken)
        {
            try
            {
                // Build UTC DateTimeOffset boundaries directly from the request.
                // The frontend sends full ISO-8601 UTC strings (e.g. "2026-03-20T17:00:00Z"
                // for Bangkok midnight on 2026-03-21), so we MUST NOT call .Date here because
                // that would strip the time component and shift the window by up to ±UTC-offset hours.
                DateTimeOffset startDateOffset;
                DateTimeOffset endDateOffset;

                if (request.StartDate.HasValue && request.EndDate.HasValue)
                {
                    // Preserve the exact UTC instant sent by the frontend.
                    startDateOffset = new DateTimeOffset(
                        DateTime.SpecifyKind(request.StartDate.Value, DateTimeKind.Utc),
                        TimeSpan.Zero);
                    endDateOffset = new DateTimeOffset(
                        DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc),
                        TimeSpan.Zero);
                }
                else
                {
                    // Default: Bangkok today (UTC+7)
                    var bangkokOffset = TimeSpan.FromHours(7);
                    var todayBkk = TimeZoneInfo
                        .ConvertTimeFromUtc(DateTime.UtcNow,
                            TimeZoneInfo.FindSystemTimeZoneById(
                                OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Bangkok"))
                        .Date;
                    startDateOffset = new DateTimeOffset(todayBkk, bangkokOffset);
                    endDateOffset   = new DateTimeOffset(todayBkk.AddDays(1), bangkokOffset);
                }

                // Track display dates (Bangkok) for response
                var bangkokTz = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Bangkok");
                var startDate = TimeZoneInfo.ConvertTime(startDateOffset, bangkokTz).Date;
                var endDate   = TimeZoneInfo.ConvertTime(endDateOffset.AddTicks(-1), bangkokTz).Date;

                // Get all jobs for the employee
                var allJobs = await _jobRepository.GetMyTasksAsync(request.EmployeeId, cancellationToken);
                
                // For task statistics: filter by CreatedDate (when job was created)
                var jobsByCreatedDate = allJobs.Where(j => j.CreatedDate >= startDateOffset && j.CreatedDate <= endDateOffset).ToList();

                // Calculate task statistics
                var taskStats = new TaskStatsDto(
                    Total: jobsByCreatedDate.Count,
                    Pending: jobsByCreatedDate.Count(j => j.Status == JobStatus.Pending),
                    InProgress: jobsByCreatedDate.Count(j => j.Status == JobStatus.InProgress || j.Status == JobStatus.Assigned),
                    CompletedWon: jobsByCreatedDate.Count(j => j.Status == JobStatus.ClosedWon),
                    CompletedLost: jobsByCreatedDate.Count(j => j.Status == JobStatus.ClosedLost),
                    Cancelled: jobsByCreatedDate.Count(j => j.Status == JobStatus.Cancelled)
                );

                // For sales statistics: filter by ClosedDate (when job was closed) for closed jobs
                // This ensures sales are counted in the period when they were actually closed, not when created
                // For old data without ClosedDate, fallback to CreatedDate to ensure backward compatibility
                var jobsWithReports = allJobs
                    .Where(j => !string.IsNullOrWhiteSpace(j.ReportJson))
                    .Where(j =>
                    {
                        // For closed jobs, prefer ClosedDate but fallback to CreatedDate for old data
                        if (j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost)
                        {
                            // Use ClosedDate if available, otherwise use CreatedDate (for backward compatibility with old data)
                            // Compare DateTimeOffset directly (they're already in UTC)
                            var jobDate = j.ClosedDate ?? j.CreatedDate;
                            return jobDate >= startDateOffset && jobDate <= endDateOffset;
                        }
                        // For non-closed jobs with reports, use CreatedDate
                        return j.CreatedDate >= startDateOffset && j.CreatedDate <= endDateOffset;
                    })
                    .ToList();
                
                int successCount = 0;
                int pendingCount = 0;
                int failedCount = 0;
                decimal totalSalesAmount = 0;

                foreach (var job in jobsWithReports)
                {
                    try
                    {
                        var report = JsonSerializer.Deserialize<JobReport>(job.ReportJson!);
                        if (report != null)
                        {
                            var salesStatus = report.SalesStatus?.ToLower() ?? string.Empty;
                            
                            if (salesStatus == "success")
                            {
                                successCount++;
                                // Calculate sales amount from Description field using helper
                                var amount = SalesAmountHelper.ExtractSalesAmount(report.Description);
                                if (amount > 0)
                                {
                                    totalSalesAmount += amount;
                                    _logger.LogInformation(
                                        "Extracted sales amount {Amount} from job {JobId} (JobNumber: {JobNumber}). Description: {Description}",
                                        amount, job.Id, job.JobNumber, report.Description);
                                }
                                else if (!string.IsNullOrWhiteSpace(report.Description))
                                {
                                    // Log when we have a description but couldn't extract amount (for debugging)
                                    _logger.LogWarning(
                                        "Could not extract sales amount from description for job {JobId} (JobNumber: {JobNumber}). Description: {Description}",
                                        job.Id, job.JobNumber, report.Description);
                                }
                                else
                                {
                                    _logger.LogWarning(
                                        "Job {JobId} (JobNumber: {JobNumber}) has success status but no description",
                                        job.Id, job.JobNumber);
                                }
                            }
                            else if (salesStatus == "pending")
                                pendingCount++;
                            else if (salesStatus == "failed")
                                failedCount++;
                        }
                    }
                    catch
                    {
                        // Skip invalid JSON
                    }
                }

                var totalSalesReports = jobsWithReports.Count;
                var conversionRate = totalSalesReports > 0 
                    ? Math.Round((decimal)successCount / totalSalesReports * 100, 2) 
                    : 0;

                var salesStats = new SalesStatsDto(
                    Total: totalSalesReports,
                    Success: successCount,
                    Pending: pendingCount,
                    Failed: failedCount,
                    ConversionRate: conversionRate,
                    TotalSalesAmount: totalSalesAmount
                );

                return new GetMyWorkStatsResponse(
                    TaskStats: taskStats,
                    SalesStats: salesStats,
                    StartDate: startDate,
                    EndDate: endDate
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving work stats for employee with Id: {EmployeeId}", request.EmployeeId);
                throw;
            }
        }
    }
}
