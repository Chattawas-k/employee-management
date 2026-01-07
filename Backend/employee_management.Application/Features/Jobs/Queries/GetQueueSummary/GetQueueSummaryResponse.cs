using employee_management.Domain.Enums;
using System;
using System.Collections.Generic;

namespace employee_management.Application.Features.Jobs.Queries.GetQueueSummary
{
    public sealed record GetQueueSummaryResponse(
        List<QueueSummaryJobDto> Jobs
    );

    public sealed record QueueSummaryJobDto(
        Guid Id,
        string JobNumber,
        string Title,
        string Customer,
        string Description,
        Guid AssigneeId,
        string? AssigneeName,
        JobStatus Status,
        JobPriority Priority,
        DateTimeOffset CreatedDate,
        DateTimeOffset? UpdatedDate,
        List<QueueSummaryStatusLogDto> StatusLogs
    );

    public sealed record QueueSummaryStatusLogDto(
        string Status,
        DateTimeOffset Timestamp
    );
}

