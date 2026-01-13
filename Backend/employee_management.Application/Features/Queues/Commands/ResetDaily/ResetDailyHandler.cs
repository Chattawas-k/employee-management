using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Application.Common.Services;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.ResetDaily
{
    public sealed class ResetDailyHandler : IRequestHandler<ResetDailyRequest, ResetDailyResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IQueueRepository _queueRepository;
        private readonly IBusinessDateTimeProvider _dateTimeProvider;

        public ResetDailyHandler(
            IUnitOfWork unitOfWork,
            IEmployeeRepository employeeRepository,
            IQueueRepository queueRepository,
            IBusinessDateTimeProvider dateTimeProvider)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _queueRepository = queueRepository;
            _dateTimeProvider = dateTimeProvider;
        }

        public async Task<ResetDailyResponse> Handle(ResetDailyRequest request, CancellationToken cancellationToken)
        {
            // Get all active employees
            var activeEmployees = await _employeeRepository.GetAll(cancellationToken);
            var employeesToQueue = activeEmployees
                .Where(e => e.Status == EmployeeStatus.Active && !e.IsDeleted)
                .OrderBy(e => e.CreatedDate)
                .ToList();

            var businessDate = request.Date.Date;
            var previousDate = businessDate.AddDays(-1);

            // Rotate Master Queue based on previous day (head -> tail)
            var previousQueues = await _queueRepository.GetByDateAsync(previousDate, cancellationToken);
            var previousOrdered = previousQueues
                .Where(q => !q.IsDeleted)
                .OrderBy(q => q.Position)
                .ToList();

            var rotatedEmployeeIds = new List<Guid>();
            if (previousOrdered.Count > 0)
            {
                rotatedEmployeeIds.AddRange(previousOrdered.Skip(1).Select(q => q.EmployeeId));
                rotatedEmployeeIds.Add(previousOrdered[0].EmployeeId);
            }

            var activeEmployeeIds = new HashSet<Guid>(employeesToQueue.Select(e => e.Id));
            rotatedEmployeeIds = rotatedEmployeeIds.Where(activeEmployeeIds.Contains).ToList();

            var remainingEmployees = employeesToQueue
                .Where(e => !rotatedEmployeeIds.Contains(e.Id))
                .ToList();

            var finalOrder = new List<Guid>();
            if (rotatedEmployeeIds.Count > 0)
            {
                finalOrder.AddRange(rotatedEmployeeIds);
                finalOrder.AddRange(remainingEmployees.Select(e => e.Id));
            }
            else
            {
                // No previous queue → fallback to created date ordering for the day
                finalOrder.AddRange(employeesToQueue.Select(e => e.Id));
            }

            // Delete existing queues for the date
            var existingQueues = await _queueRepository.GetByDateAsync(businessDate, cancellationToken);
            foreach (var queue in existingQueues)
            {
                _queueRepository.Delete(queue);
            }

            // Create new queues
            int position = 1;
            var queueDateUtc = _dateTimeProvider.ToUtcKindDate(businessDate);
            
            foreach (var employeeId in finalOrder)
            {
                var queue = new Domain.Entities.Queue
                {
                    EmployeeId = employeeId,
                    Position = position++,
                    // Daily reset: everyone starts "not ready"
                    Status = QueueStatus.Inactive,
                    AvailabilityStatus = AvailabilityStatus.Unavailable,
                    Round = 1,
                    QueueDate = queueDateUtc
                };
                _queueRepository.Create(queue);
            }

            await _unitOfWork.Save(cancellationToken);

            return new ResetDailyResponse(finalOrder.Count, queueDateUtc);
        }
    }
}

