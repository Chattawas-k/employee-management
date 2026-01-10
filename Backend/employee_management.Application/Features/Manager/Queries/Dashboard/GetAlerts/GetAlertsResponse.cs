namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetAlerts
{
    public sealed record GetAlertsResponse(
        List<AlertDto> Alerts
    );

    public sealed record AlertDto(
        string Id,
        AlertSeverity Severity,
        string Type,
        string Message,
        DateTimeOffset Timestamp
    );

    public enum AlertSeverity
    {
        Low = 1,
        Medium = 2,
        High = 3
    }
}
