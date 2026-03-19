using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Common.Helpers;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.JobsRepository
{
    public class JobRepository : BaseRepository<Job>, IJobRepository
    {
        public JobRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public new async Task<Job?> Get(Guid id, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted)
                .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
        }

        public async Task<List<Job>> GetMyTasksAsync(Guid employeeId, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && j.AssigneeId == employeeId)
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Job>> GetSalesReportsAsync(Guid employeeId, string? status, int? pageNumber, int? pageSize, CancellationToken cancellationToken)
        {
            // Filter by AssigneeId (EmployeeId) to show only jobs assigned to the current employee
            // Note: Report is a computed property (deserialized from ReportJson), so for report-based statuses
            // we need to filter in memory after loading rows with ReportJson.
            var statusLower = status?.Trim().ToLowerInvariant();
            var isRejected = statusLower is "rejected" or "cancelled";

            IQueryable<Job> query = Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && j.AssigneeId == employeeId);

            if (isRejected)
            {
                // Rejected = job cancelled (no sales report required)
                query = query.Where(j => j.Status == JobStatus.Cancelled);
                var rejectedJobs = await query
                    .OrderByDescending(j => j.CreatedDate)
                    .ToListAsync(cancellationToken);

                return ApplyPaging(rejectedJobs, pageNumber, pageSize);
            }

            if (string.IsNullOrWhiteSpace(statusLower))
            {
                // All = jobs with a report OR cancelled jobs
                var allJobs = await query
                    .Where(j => j.ReportJson != null || j.Status == JobStatus.Cancelled)
                    .OrderByDescending(j => j.CreatedDate)
                    .ToListAsync(cancellationToken);

                // Keep only rows that actually deserialize to a report, plus cancelled jobs
                allJobs = allJobs
                    .Where(j => j.Status == JobStatus.Cancelled || j.Report != null)
                    .ToList();

                return ApplyPaging(allJobs, pageNumber, pageSize);
            }

            // Report-based statuses: pending/success/failed
            var jobsWithReportJson = await query
                .Where(j => j.ReportJson != null)
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);

            var filtered = jobsWithReportJson
                .Where(j => j.Report != null &&
                            !string.IsNullOrWhiteSpace(j.Report.SalesStatus) &&
                            j.Report.SalesStatus.Trim().ToLowerInvariant() == statusLower)
                .ToList();

            return ApplyPaging(filtered, pageNumber, pageSize);
        }

        public async Task<List<Job>> GetMyJobsForSalesReportExportAsync(Guid employeeId, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Include(j => j.ProductCategory)
                .Where(j => !j.IsDeleted && j.AssigneeId == employeeId)
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Job>> GetSalesReportsForAdminAsync(DateTime? dateFrom, DateTime? dateTo, Guid? assigneeId, string? search, CancellationToken cancellationToken)
        {
            // Base query for admin: all jobs, optionally filtered by date range (CreatedDate) and assignee.
            // Search is applied partially in DB (Job fields + assignee name), and fully in-memory by handlers.
            var query = BuildAdminSalesReportBaseQuery(dateFrom, dateTo, assigneeId, search);
            return await query
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Job>> GetSalesReportsForAdminExportAsync(DateTime? dateFrom, DateTime? dateTo, Guid? assigneeId, string? search, CancellationToken cancellationToken)
        {
            // Export uses same base query (no paging).
            var query = BuildAdminSalesReportBaseQuery(dateFrom, dateTo, assigneeId, search);
            return await query
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        private IQueryable<Job> BuildAdminSalesReportBaseQuery(DateTime? dateFrom, DateTime? dateTo, Guid? assigneeId, string? search)
        {
            IQueryable<Job> query = Context.Jobs
                .Include(j => j.Employee)
                .Include(j => j.ProductCategory)
                .Where(j => !j.IsDeleted);

            if (assigneeId.HasValue && assigneeId.Value != Guid.Empty)
            {
                query = query.Where(j => j.AssigneeId == assigneeId.Value);
            }

            // Date filters are provided as date-only (Bangkok). Convert to UTC range and filter CreatedDate.
            var (startUtc, endUtc) = ToUtcRangeFromBangkokDates(dateFrom, dateTo);
            if (startUtc.HasValue)
            {
                query = query.Where(j => j.CreatedDate >= startUtc.Value);
            }
            if (endUtc.HasValue)
            {
                query = query.Where(j => j.CreatedDate < endUtc.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = $"%{search.Trim()}%";
                query = query.Where(j =>
                    EF.Functions.ILike(j.JobNumber, term) ||
                    (j.JobRunningCode != null && EF.Functions.ILike(j.JobRunningCode, term)) ||
                    EF.Functions.ILike(j.Title, term) ||
                    EF.Functions.ILike(j.Customer, term) ||
                    (j.Employee != null && EF.Functions.ILike(j.Employee.Name, term)));
            }

            return query;
        }

        private static (DateTimeOffset? startUtc, DateTimeOffset? endUtc) ToUtcRangeFromBangkokDates(DateTime? dateFrom, DateTime? dateTo)
        {
            if (!dateFrom.HasValue && !dateTo.HasValue)
                return (null, null);

            // Bangkok timezone: Asia/Bangkok (Linux/macOS) or SE Asia Standard Time (Windows)
            TimeZoneInfo tz;
            try
            {
                tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok");
            }
            catch
            {
                tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }

            DateTimeOffset? startUtc = null;
            DateTimeOffset? endUtc = null;

            if (dateFrom.HasValue)
            {
                var localStart = DateTime.SpecifyKind(dateFrom.Value.Date, DateTimeKind.Unspecified);
                var utcStart = TimeZoneInfo.ConvertTimeToUtc(localStart, tz);
                startUtc = new DateTimeOffset(utcStart, TimeSpan.Zero);
            }

            if (dateTo.HasValue)
            {
                // inclusive end date → exclusive next day at 00:00
                var localEndExclusive = DateTime.SpecifyKind(dateTo.Value.Date.AddDays(1), DateTimeKind.Unspecified);
                var utcEndExclusive = TimeZoneInfo.ConvertTimeToUtc(localEndExclusive, tz);
                endUtc = new DateTimeOffset(utcEndExclusive, TimeSpan.Zero);
            }

            return (startUtc, endUtc);
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

        public async Task<int> CountJobsByDateAsync(DateTime date, CancellationToken cancellationToken)
        {
            // Convert to DateTimeOffset to avoid timezone issues with PostgreSQL
            var utcDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            var targetDate = new DateTimeOffset(utcDate, TimeSpan.Zero);
            var nextDate = targetDate.AddDays(1);
            
            return await Context.Jobs
                .Where(j => !j.IsDeleted && 
                           j.CreatedDate >= targetDate && 
                           j.CreatedDate < nextDate)
                .CountAsync(cancellationToken);
        }

        public async Task<List<Job>> GetAllJobsAsync(CancellationToken cancellationToken)
        {
            // StatusLogs is a computed property that deserializes from StatusLogsJson column
            // It's configured as Ignore in ApplicationDbContext, so we don't need to Include it
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted)
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        // Manager-specific queries
        public async Task<List<Job>> GetJobsByStatusAsync(employee_management.Domain.Enums.JobStatus? status, DateTime? dateFrom, DateTime? dateTo, CancellationToken cancellationToken)
        {
            var query = Context.Jobs
                .Include(j => j.Employee)
                .Include(j => j.ProductCategory)
                .Where(j => !j.IsDeleted);

            if (status.HasValue)
            {
                query = query.Where(j => j.Status == status.Value);
            }

            if (dateFrom.HasValue)
            {
                var utcDateFrom = DateTime.SpecifyKind(dateFrom.Value.Date, DateTimeKind.Utc);
                var dateFromOffset = new DateTimeOffset(utcDateFrom, TimeSpan.Zero);
                query = query.Where(j => j.CreatedDate >= dateFromOffset);
            }

            if (dateTo.HasValue)
            {
                var utcDateTo = DateTime.SpecifyKind(dateTo.Value.Date.AddDays(1), DateTimeKind.Utc);
                var dateToOffset = new DateTimeOffset(utcDateTo, TimeSpan.Zero);
                query = query.Where(j => j.CreatedDate < dateToOffset);
            }

            return await query
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Job>> GetJobsWithSlaBreachAsync(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && 
                    ((j.SlaWaitingBreachAt.HasValue && now >= j.SlaWaitingBreachAt.Value) ||
                     (j.SlaAssignedBreachAt.HasValue && now >= j.SlaAssignedBreachAt.Value)))
                .ToListAsync(cancellationToken);
        }

        public async Task<int> GetWaitingJobsCountAsync(CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Where(j => !j.IsDeleted && j.Status == employee_management.Domain.Enums.JobStatus.Pending)
                .CountAsync(cancellationToken);
        }

        public async Task<double> GetAverageWaitTimeAsync(CancellationToken cancellationToken)
        {
            var waitingJobs = await Context.Jobs
                .Where(j => !j.IsDeleted && j.Status == employee_management.Domain.Enums.JobStatus.Pending)
                .ToListAsync(cancellationToken);

            if (!waitingJobs.Any())
            {
                return 0;
            }

            var now = DateTimeOffset.UtcNow;
            var totalWaitMinutes = waitingJobs.Sum(j => (now - j.CreatedDate).TotalMinutes);
            return totalWaitMinutes / waitingJobs.Count;
        }

        public async Task<List<Job>> GetTopWaitingJobsAsync(int count, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && j.Status == employee_management.Domain.Enums.JobStatus.Pending)
                .OrderBy(j => j.CreatedDate)
                .Take(count)
                .ToListAsync(cancellationToken);
        }

        public async Task<Dictionary<string, decimal>> GetSalesByCategoryAsync(DateTime dateFrom, DateTime dateTo, CancellationToken cancellationToken)
        {
            var utcDateFrom = DateTime.SpecifyKind(dateFrom.Date, DateTimeKind.Utc);
            var utcDateTo = DateTime.SpecifyKind(dateTo.Date.AddDays(1), DateTimeKind.Utc);
            var dateFromOffset = new DateTimeOffset(utcDateFrom, TimeSpan.Zero);
            var dateToOffset = new DateTimeOffset(utcDateTo, TimeSpan.Zero);

            var jobs = await Context.Jobs
                .Include(j => j.Employee)
                .Include(j => j.ProductCategory)
                .Where(j => !j.IsDeleted && 
                    j.Status == employee_management.Domain.Enums.JobStatus.ClosedWon &&
                    j.CreatedDate >= dateFromOffset &&
                    j.CreatedDate < dateToOffset &&
                    j.ReportJson != null)
                .ToListAsync(cancellationToken);

            // Use categories from Sales Report (JobReport.ProductCategory) which is comma-separated
            // If Report.ProductCategory is empty, fallback to Job.ProductCategoryId or Job.Category
            var categorySales = new Dictionary<string, decimal>();
            
            foreach (var job in jobs.Where(j => j.Report != null && j.Report.SalesStatus.ToLower() == "success"))
            {
                var amount = employee_management.Application.Common.Helpers.SalesAmountHelper.ExtractSalesAmount(job.Report?.Description);
                if (amount <= 0) continue;
                
                // Priority: Use JobReport.ProductCategory (from Sales Report dialog)
                // If empty, fallback to Job.ProductCategoryId or Job.Category
                var categories = new List<string>();
                
                if (!string.IsNullOrWhiteSpace(job.Report?.ProductCategory))
                {
                    // Split comma-separated categories from Sales Report
                    categories.AddRange(job.Report.ProductCategory
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(c => c.Trim())
                        .Where(c => !string.IsNullOrWhiteSpace(c)));
                }
                
                // If no categories from Report, use Job.ProductCategoryId or Job.Category (backward compatibility)
                if (categories.Count == 0)
                {
                    var fallbackCategory = !string.IsNullOrEmpty(job.ProductCategory?.Name)
                        ? job.ProductCategory.Name
                        : (!string.IsNullOrEmpty(job.Category) ? job.Category : "ไม่ระบุหมวดหมู่");
                    categories.Add(fallbackCategory);
                }
                
                // Distribute sales amount across all categories (if multiple categories selected)
                var amountPerCategory = amount / categories.Count;
                foreach (var category in categories)
                {
                    if (categorySales.ContainsKey(category))
                    {
                        categorySales[category] += amountPerCategory;
                    }
                    else
                    {
                        categorySales[category] = amountPerCategory;
                    }
                }
            }
            
            return categorySales;
        }

        public async Task<Dictionary<employee_management.Domain.Enums.JobStatus, int>> GetStatusCountsAsync(DateTime? dateFrom, DateTime? dateTo, CancellationToken cancellationToken)
        {
            var query = Context.Jobs.Where(j => !j.IsDeleted);

            if (dateFrom.HasValue)
            {
                var utcDateFrom = DateTime.SpecifyKind(dateFrom.Value.Date, DateTimeKind.Utc);
                var dateFromOffset = new DateTimeOffset(utcDateFrom, TimeSpan.Zero);
                query = query.Where(j => j.CreatedDate >= dateFromOffset);
            }

            if (dateTo.HasValue)
            {
                var utcDateTo = DateTime.SpecifyKind(dateTo.Value.Date.AddDays(1), DateTimeKind.Utc);
                var dateToOffset = new DateTimeOffset(utcDateTo, TimeSpan.Zero);
                query = query.Where(j => j.CreatedDate < dateToOffset);
            }

            var jobs = await query.ToListAsync(cancellationToken);
            return jobs
                .GroupBy(j => j.Status)
                .ToDictionary(g => g.Key, g => g.Count());
        }
    }
}

