using MediatR;

namespace employee_management.Application.Features.Queues.Commands.Archive
{
    public sealed record ArchiveRequest(
        DateTime SourceDate,
        DateTime? TargetDate = null
    ) : IRequest<ArchiveResponse>;
}

