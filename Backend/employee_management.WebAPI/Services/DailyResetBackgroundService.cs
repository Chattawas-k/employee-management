using employee_management.Application.Common.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace employee_management.WebAPI.Services
{
    public class DailyResetBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IBusinessDateTimeProvider _dateTimeProvider;
        private readonly ILogger<DailyResetBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1); // Check every minute
        private DateTime _lastResetBusinessDate;

        public DailyResetBackgroundService(
            IServiceProvider serviceProvider,
            IBusinessDateTimeProvider dateTimeProvider,
            ILogger<DailyResetBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _dateTimeProvider = dateTimeProvider;
            _logger = logger;
            // Only run reset close to midnight; initializing to "yesterday" ensures we run
            // if the service starts within the first minutes of a new day.
            _lastResetBusinessDate = _dateTimeProvider.GetBangkokTodayDate().AddDays(-1);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyResetBackgroundService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var bangkokNow = _dateTimeProvider.GetBangkokNow();
                    var today = bangkokNow.Date;

                    // Run once per business day, near midnight Bangkok time.
                    // This avoids accidental resets during the day.
                    if (today > _lastResetBusinessDate && bangkokNow.TimeOfDay < TimeSpan.FromMinutes(5))
                    {
                        _logger.LogInformation("Starting daily reset at {Time} (Bangkok)", bangkokNow);

                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var resetService = scope.ServiceProvider.GetRequiredService<IDailyResetService>();
                            await resetService.ResetDailyStatusAsync(stoppingToken);
                        }

                        _lastResetBusinessDate = today;
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

