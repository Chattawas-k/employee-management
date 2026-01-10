namespace employee_management.Application.Features.Manager.Commands.Settings.UpdateQueueRules
{
    public sealed record UpdateQueueRulesResponse(
        Guid Id,
        bool IsActive
    );
}
