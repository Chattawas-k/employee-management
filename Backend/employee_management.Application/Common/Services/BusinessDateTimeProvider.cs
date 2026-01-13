using System;

namespace employee_management.Application.Common.Services
{
    public sealed class BusinessDateTimeProvider : IBusinessDateTimeProvider
    {
        private static readonly Lazy<TimeZoneInfo> BangkokTimeZone = new(() =>
        {
            // Linux/macOS: "Asia/Bangkok", Windows: "SE Asia Standard Time"
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
        });

        public DateTimeOffset GetBangkokNow()
        {
            var utcNow = DateTimeOffset.UtcNow;
            return TimeZoneInfo.ConvertTime(utcNow, BangkokTimeZone.Value);
        }

        public DateTime GetBangkokTodayDate()
        {
            return GetBangkokNow().Date;
        }

        public DateTime ToUtcKindDate(DateTime date)
        {
            // Postgres + Npgsql: keep using DateTimeKind.Utc for date-only values to avoid Kind issues
            return DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        }
    }
}

