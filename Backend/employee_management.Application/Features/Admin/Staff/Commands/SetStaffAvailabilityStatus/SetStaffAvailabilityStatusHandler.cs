using employee_management.Application.Common.Exceptions;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffAvailabilityStatus
{
    public sealed class SetStaffAvailabilityStatusHandler : IRequestHandler<SetStaffAvailabilityStatusRequest, SetStaffAvailabilityStatusResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IQueueRepository _queueRepository;
        private readonly IEmployeeStatusHistoryWriter _historyWriter;
        private readonly IClientSourceProvider _clientSourceProvider;
        private readonly INotificationService _notificationService;
        private readonly IBusinessDateTimeProvider _dateTimeProvider;
        private readonly ILogger<SetStaffAvailabilityStatusHandler> _logger;

        public SetStaffAvailabilityStatusHandler(
            IUnitOfWork unitOfWork,
            IEmployeeRepository employeeRepository,
            IQueueRepository queueRepository,
            IEmployeeStatusHistoryWriter historyWriter,
            IClientSourceProvider clientSourceProvider,
            INotificationService notificationService,
            IBusinessDateTimeProvider dateTimeProvider,
            ILogger<SetStaffAvailabilityStatusHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _queueRepository = queueRepository;
            _historyWriter = historyWriter;
            _clientSourceProvider = clientSourceProvider;
            _notificationService = notificationService;
            _dateTimeProvider = dateTimeProvider;
            _logger = logger;
        }

        public async Task<SetStaffAvailabilityStatusResponse> Handle(SetStaffAvailabilityStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var employee = await _employeeRepository.Get(request.StaffId, cancellationToken);
                if (employee == null)
                {
                    throw new NoDataFoundException($"Employee with Id {request.StaffId} not found.");
                }

                var newStatus = ParseStatus(request.Status);
                var today = _dateTimeProvider.GetBangkokTodayDate();

                var currentQueue = await _queueRepository.GetByEmployeeIdAndDateAsync(request.StaffId, today, cancellationToken);
                var previousStatus = currentQueue?.AvailabilityStatus;

                // Keep same protection as self: do not allow overriding Busy while serving a customer.
                if (previousStatus == AvailabilityStatus.Busy && newStatus != AvailabilityStatus.Busy)
                {
                    throw new BadRequestException("ขณะนี้พนักงานติดลูกค้า ไม่สามารถเปลี่ยนสถานะได้จนกว่าจะปิดงาน");
                }

                var queue = await _queueRepository.UpdateAvailabilityStatusAsync(request.StaffId, today, newStatus, cancellationToken);
                if (queue == null)
                {
                    throw new InvalidOperationException($"Failed to update or create queue for employee {request.StaffId} on {today:yyyy-MM-dd}");
                }

                await _historyWriter.TryWriteAsync(
                    employeeId: request.StaffId,
                    previousStatus: previousStatus,
                    newStatus: newStatus,
                    changeReason: ChangeReason.Manual,
                    changedBy: request.ChangedByEmployeeId,
                    actorType: StatusActorType.Admin,
                    source: _clientSourceProvider.GetSource(),
                    notes: "Changed by admin",
                    changedAt: DateTimeOffset.UtcNow,
                    cancellationToken: cancellationToken);

                await _unitOfWork.Save(cancellationToken);

                await _notificationService.SendQueueUpdatedNotificationAsync();

                var statusKey = ToCamelCase(newStatus.ToString());
                await _notificationService.SendEmployeeStatusChangedNotificationAsync(request.StaffId.ToString(), statusKey);

                return new SetStaffAvailabilityStatusResponse(
                    EmployeeId: queue.EmployeeId,
                    AvailabilityStatus: queue.AvailabilityStatus,
                    QueueStatus: queue.Status,
                    UpdatedDate: queue.UpdatedDate
                );
            }
            catch (Exception ex) when (ex is not NoDataFoundException && ex is not BadRequestException)
            {
                _logger.LogError(ex, "Error setting availability status for staff {StaffId}", request.StaffId);
                throw;
            }
        }

        private static AvailabilityStatus ParseStatus(string status)
        {
            var normalized = (status ?? string.Empty).Trim().ToLowerInvariant().Replace(" ", string.Empty);
            return normalized switch
            {
                "available" => AvailabilityStatus.Available,
                "lunchbreak" => AvailabilityStatus.LunchBreak,
                "unavailable" => AvailabilityStatus.Unavailable,
                "leave" => AvailabilityStatus.Leave,
                "offsitecustomer" => AvailabilityStatus.OffsiteCustomer,
                _ => throw new BadRequestException($"Invalid status: {status}")
            };
        }

        private static string ToCamelCase(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            return char.ToLowerInvariant(value[0]) + value.Substring(1);
        }
    }
}

