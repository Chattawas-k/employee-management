namespace employee_management.Application.Features.Queues.Commands.MigrateInactiveStatus
{
    public sealed record MigrateInactiveStatusResponse(
        int MigratedCount,
        string Message
    );
}

