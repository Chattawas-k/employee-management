using employee_management.Domain.Enums;

namespace employee_management.Application.Common.Services
{
    public interface IEmployeeStatusHistoryWriter
    {
        Task<bool> TryWriteAsync(
            Guid employeeId,
            AvailabilityStatus? previousStatus,
            AvailabilityStatus newStatus,
            ChangeReason changeReason,
            Guid? changedBy,
            StatusActorType actorType,
            StatusChangeSource source,
            string? notes,
            DateTimeOffset changedAt,
            CancellationToken cancellationToken);
    }
}

