namespace employee_management.Application.Common.Services
{
    public interface IBusinessDateTimeProvider
    {
        DateTimeOffset GetBangkokNow();
        DateTime GetBangkokTodayDate();
        DateTime ToUtcKindDate(DateTime date);
    }
}

