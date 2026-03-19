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
            // Run reset at 02:30 AM Bangkok time; initializing to "yesterday" ensures we run
            // if the service starts after 02:30 on a new day.
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
                    var timeOfDay = bangkokNow.TimeOfDay;

                    // Run once per business day at 02:30 AM Bangkok time.
                    // Window: 02:25 - 02:35 to ensure we catch the reset even if there's a delay
                    // This avoids accidental resets during the day.
                    var targetHour = 2;
                    var targetMinute = 30;
                    var windowStart = TimeSpan.FromHours(targetHour).Add(TimeSpan.FromMinutes(25)); // 02:25
                    var windowEnd = TimeSpan.FromHours(targetHour).Add(TimeSpan.FromMinutes(35)); // 02:35
                    var isInResetWindow = timeOfDay >= windowStart && timeOfDay < windowEnd;

                    if (today > _lastResetBusinessDate && isInResetWindow)
                    {
                        _logger.LogInformation("Starting daily reset at {Time} (Bangkok) for date {Date}", 
                            bangkokNow, today.ToString("yyyy-MM-dd"));

                        var retryCount = 0;
                        const int maxRetries = 3;
                        var success = false;

                        while (retryCount < maxRetries && !success)
                        {
                            try
                            {
                                using (var scope = _serviceProvider.CreateScope())
                                {
                                    var resetService = scope.ServiceProvider.GetRequiredService<IDailyResetService>();
                                    await resetService.ResetDailyStatusAsync(stoppingToken);
                                }

                                _lastResetBusinessDate = today;
                                success = true;
                                _logger.LogInformation("Daily reset completed successfully for {Date}", 
                                    today.ToString("yyyy-MM-dd"));
                            }
                            catch (Exception ex)
                            {
                                retryCount++;
                                _logger.LogWarning(ex, 
                                    "Daily reset attempt {Attempt}/{MaxRetries} failed for {Date}. Retrying...", 
                                    retryCount, maxRetries, today.ToString("yyyy-MM-dd"));

                                if (retryCount < maxRetries)
                                {
                                    // Wait before retry: 30 seconds for first retry, 60 seconds for second
                                    await Task.Delay(TimeSpan.FromSeconds(30 * retryCount), stoppingToken);
                                }
                                else
                                {
                                    _logger.LogError(ex, 
                                        "Daily reset failed after {MaxRetries} attempts for {Date}", 
                                        maxRetries, today.ToString("yyyy-MM-dd"));
                                    throw; // Re-throw after max retries
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Critical error in DailyResetBackgroundService. Service will continue running.");
                    // Don't re-throw - allow service to continue even if one reset fails
                }

                // Wait before next check
                try
                {
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when service is stopping
                    break;
                }
            }

            _logger.LogInformation("DailyResetBackgroundService stopped");
        }
    }
}

