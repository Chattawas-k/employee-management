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
                // Determine date range
                DateTime startDate;
                DateTime endDate;

                if (request.StartDate.HasValue && request.EndDate.HasValue)
                {
                    startDate = request.StartDate.Value.Date;
                    endDate = request.EndDate.Value.Date.AddDays(1).AddSeconds(-1);
                }
                else
                {
                    // Default to today
                    startDate = DateTime.Today;
                    endDate = DateTime.Today.AddDays(1).AddSeconds(-1);
                }

                // Get all jobs for the employee within the date range
                var allJobs = await _jobRepository.GetMyTasksAsync(request.EmployeeId, cancellationToken);
                
                // Filter by date range
                var jobs = allJobs.Where(j => j.CreatedDate >= startDate && j.CreatedDate <= endDate).ToList();

                // Calculate task statistics
                var taskStats = new TaskStatsDto(
                    Total: jobs.Count,
                    Pending: jobs.Count(j => j.Status == JobStatus.Pending),
                    InProgress: jobs.Count(j => j.Status == JobStatus.InProgress || j.Status == JobStatus.Assigned),
                    CompletedWon: jobs.Count(j => j.Status == JobStatus.ClosedWon),
                    CompletedLost: jobs.Count(j => j.Status == JobStatus.ClosedLost),
                    Cancelled: jobs.Count(j => j.Status == JobStatus.Cancelled)
                );

                // Calculate sales statistics from job reports
                var jobsWithReports = jobs.Where(j => !string.IsNullOrWhiteSpace(j.ReportJson)).ToList();
                
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
                                totalSalesAmount += amount;
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
