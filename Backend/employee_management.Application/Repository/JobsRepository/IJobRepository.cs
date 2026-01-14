using employee_management.Domain.Entities;

namespace employee_management.Application.Repository.JobsRepository
{
    public interface IJobRepository : IBaseRepository<Job>
    {
        Task<List<Job>> GetMyTasksAsync(Guid employeeId, CancellationToken cancellationToken);
        Task<List<Job>> GetSalesReportsAsync(Guid employeeId, string? status, int? pageNumber, int? pageSize, CancellationToken cancellationToken);
        Task<List<Job>> GetMyJobsForSalesReportExportAsync(Guid employeeId, CancellationToken cancellationToken);
        Task<int> CountJobsByDateAsync(DateTime date, CancellationToken cancellationToken);
        Task<List<Job>> GetAllJobsAsync(CancellationToken cancellationToken);
        
        // Manager-specific queries
        Task<List<Job>> GetJobsByStatusAsync(employee_management.Domain.Enums.JobStatus? status, DateTime? dateFrom, DateTime? dateTo, CancellationToken cancellationToken);
        Task<List<Job>> GetJobsWithSlaBreachAsync(CancellationToken cancellationToken);
        Task<int> GetWaitingJobsCountAsync(CancellationToken cancellationToken);
        Task<double> GetAverageWaitTimeAsync(CancellationToken cancellationToken);
        Task<List<Job>> GetTopWaitingJobsAsync(int count, CancellationToken cancellationToken);
        Task<Dictionary<string, decimal>> GetSalesByCategoryAsync(DateTime dateFrom, DateTime dateTo, CancellationToken cancellationToken);
        Task<Dictionary<employee_management.Domain.Enums.JobStatus, int>> GetStatusCountsAsync(DateTime? dateFrom, DateTime? dateTo, CancellationToken cancellationToken);
    }
}

