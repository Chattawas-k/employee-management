namespace employee_management.Application.Features.Queues.Commands.ResetDaily
{
    public sealed record ResetDailyResponse(
        int QueuesCreated,
        DateTime Date
    );
}

