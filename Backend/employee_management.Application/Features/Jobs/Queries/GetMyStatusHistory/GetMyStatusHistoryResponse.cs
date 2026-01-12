using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Queries.GetMyStatusHistory
{
    public sealed record GetMyStatusHistoryResponse(
        List<JobStatusHistoryDto> Histories
    );

    public sealed record JobStatusHistoryDto(
        Guid Id,
        Guid JobId,
        string? JobNumber,
        string? Title,
        string? Customer,
        JobStatus? PreviousStatus,
        JobStatus NewStatus,
        JobChangeSource ChangeSource,
        Guid? ChangedByEmployeeId,
        string? ChangedByEmployeeName,
        DateTimeOffset ChangedDate,
        string? Notes,
        Guid? PreviousAssigneeId,
        Guid? NewAssigneeId
    );
}

