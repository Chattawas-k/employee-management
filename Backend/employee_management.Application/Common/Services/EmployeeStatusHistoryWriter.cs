using employee_management.Application.Repository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Common.Services
{
    public sealed class EmployeeStatusHistoryWriter : IEmployeeStatusHistoryWriter
    {
        private readonly IEmployeeStatusHistoryRepository _historyRepository;

        public EmployeeStatusHistoryWriter(IEmployeeStatusHistoryRepository historyRepository)
        {
            _historyRepository = historyRepository;
        }

        public async Task<bool> TryWriteAsync(
            Guid employeeId,
            AvailabilityStatus? previousStatus,
            AvailabilityStatus newStatus,
            ChangeReason changeReason,
            Guid? changedBy,
            StatusActorType actorType,
            StatusChangeSource source,
            string? notes,
            DateTimeOffset changedAt,
            CancellationToken cancellationToken)
        {
            // Business rule: no-op if "from" equals "to"
            if (previousStatus.HasValue && previousStatus.Value == newStatus)
            {
                return false;
            }

            // Business rule: prevent consecutive duplicate logs (even if caller passed null previousStatus)
            var latest = await _historyRepository.GetLatestAsync(employeeId, cancellationToken);
            if (latest != null && latest.NewStatus == newStatus)
            {
                return false;
            }

            var history = new EmployeeStatusHistory
            {
                EmployeeId = employeeId,
                PreviousStatus = previousStatus,
                NewStatus = newStatus,
                ChangeReason = changeReason,
                ChangedBy = changedBy,
                ActorType = actorType,
                Source = source,
                ChangedDate = changedAt,
                Notes = notes
            };

            _historyRepository.Create(history);
            return true;
        }
    }
}

