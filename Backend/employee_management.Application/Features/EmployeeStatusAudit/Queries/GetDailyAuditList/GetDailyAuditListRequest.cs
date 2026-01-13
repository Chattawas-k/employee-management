using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.EmployeeStatusAudit.Queries.GetDailyAuditList
{
    public sealed record GetDailyAuditListRequest(
        DateTime Date,
        string? Search,
        IReadOnlyList<AvailabilityStatus>? Statuses,
        StatusActorType? ActorType,
        IReadOnlyList<string>? Anomalies,
        string? Sort
    ) : IRequest<EmployeeStatusAudit.Models.DailyAuditListResponse>;
}

