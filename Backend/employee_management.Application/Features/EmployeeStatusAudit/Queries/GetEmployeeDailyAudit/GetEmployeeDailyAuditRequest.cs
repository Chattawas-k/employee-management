using MediatR;
using employee_management.Domain.Enums;
using employee_management.Application.Features.EmployeeStatusAudit.Models;

namespace employee_management.Application.Features.EmployeeStatusAudit.Queries.GetEmployeeDailyAudit
{
    public sealed record GetEmployeeDailyAuditRequest(
        Guid EmployeeId,
        DateTime Date,
        IReadOnlyList<AvailabilityStatus>? Statuses,
        StatusActorType? ActorType,
        bool OnlyAnomaly
    ) : IRequest<EmployeeDailyAuditResponse>;
}

