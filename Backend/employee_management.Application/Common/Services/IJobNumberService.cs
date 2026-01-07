namespace employee_management.Application.Common.Services
{
    public interface IJobNumberService
    {
        Task<string> GenerateJobNumberAsync(DateTime date, CancellationToken cancellationToken);
    }
}


