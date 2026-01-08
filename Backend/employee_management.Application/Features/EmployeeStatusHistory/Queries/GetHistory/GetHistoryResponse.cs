using employee_management.Domain.Enums;

namespace employee_management.Application.Features.EmployeeStatusHistory.Queries.GetHistory
{
    public sealed record GetHistoryResponse(
        List<EmployeeStatusHistoryDto> Histories
    );

    public sealed record EmployeeStatusHistoryDto(
        Guid Id,
        Guid EmployeeId,
        string EmployeeName,
        AvailabilityStatus? PreviousStatus,
        AvailabilityStatus NewStatus,
        ChangeReason ChangeReason,
        Guid? ChangedBy,
        string? ChangedByName,
        DateTimeOffset ChangedDate,
        string? Notes
    );
}

