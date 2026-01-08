using employee_management.Application.Common.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace employee_management.WebAPI.Services
{
    public class DailyResetBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DailyResetBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1); // Check every minute
        private DateTime _lastResetDate = DateTime.UtcNow.Date;

        public DailyResetBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<DailyResetBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyResetBackgroundService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    var today = now.Date;

                    // Check if it's a new day and past midnight (00:00)
                    if (today > _lastResetDate && now.Hour == 0 && now.Minute == 0)
                    {
                        _logger.LogInformation("Starting daily reset at {Time}", now);

                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var resetService = scope.ServiceProvider.GetRequiredService<IDailyResetService>();
                            await resetService.ResetDailyStatusAsync(stoppingToken);
                        }

                        _lastResetDate = today;
                        _logger.LogInformation("Daily reset completed");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in DailyResetBackgroundService");
                }

                // Wait before next check
                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("DailyResetBackgroundService stopped");
        }
    }
}

