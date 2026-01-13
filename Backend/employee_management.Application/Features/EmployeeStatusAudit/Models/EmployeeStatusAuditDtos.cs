using employee_management.Domain.Enums;

namespace employee_management.Application.Features.EmployeeStatusAudit.Models
{
    public sealed record DailyAuditSummaryDto(
        int TotalEmployees,
        int ReadyNow,
        int AnomalyCases
    );

    public sealed record DailyAuditEmployeeRowDto(
        Guid EmployeeId,
        string EmployeeName,
        AvailabilityStatus CurrentStatus,
        int ReadyMinutes,
        int BreakMinutes,
        int NotReadyMinutes,
        int OffDutyMinutes,
        int ChangeCount,
        DateTimeOffset? LastEventAt,
        AvailabilityStatus? LastEventStatus,
        IReadOnlyList<string> AnomalyFlags
    );

    public sealed record DailyAuditListResponse(
        DateTime Date,
        DailyAuditSummaryDto Summary,
        IReadOnlyList<DailyAuditEmployeeRowDto> Employees
    );

    public sealed record TimelineSegmentDto(
        DateTimeOffset Start,
        DateTimeOffset? End,
        AvailabilityStatus Status,
        int DurationMinutes,
        bool IsRunning
    );

    public sealed record TimelineEventDto(
        Guid Id,
        DateTimeOffset OccurredAt,
        AvailabilityStatus? FromStatus,
        AvailabilityStatus ToStatus,
        int DurationMinutes,
        bool IsRunning,
        StatusActorType ActorType,
        StatusChangeSource Source,
        string? Reason
    );

    public sealed record EmployeeDailyAuditResponse(
        Guid EmployeeId,
        string EmployeeName,
        DateTime Date,
        int ReadyMinutes,
        int BreakMinutes,
        int NotReadyMinutes,
        int OffDutyMinutes,
        int ChangeCount,
        AvailabilityStatus CurrentStatus,
        IReadOnlyList<string> AnomalyFlags,
        string Insight,
        IReadOnlyList<TimelineSegmentDto> MiniDayBar,
        IReadOnlyList<TimelineEventDto> Timeline
    );
}

