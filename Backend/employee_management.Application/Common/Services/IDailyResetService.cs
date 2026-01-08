namespace employee_management.Application.Common.Services
{
    public interface IDailyResetService
    {
        Task ResetDailyStatusAsync(CancellationToken cancellationToken = default);
    }
}

