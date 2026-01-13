namespace employee_management.Application.Common.Services
{
    public sealed record JobNumberResult(string JobNumber, string JobRunningCode);

    public interface IJobNumberService
    {
        Task<JobNumberResult> GenerateJobNumberAsync(DateTime date, CancellationToken cancellationToken);
    }
}


