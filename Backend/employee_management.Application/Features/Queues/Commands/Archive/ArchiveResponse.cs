namespace employee_management.Application.Features.Queues.Commands.Archive
{
    public sealed record ArchiveResponse(
        int ArchivedCount,
        DateTime SourceDate,
        DateTime TargetDate
    );
}

