using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Queues.Commands.ResetDaily
{
    public sealed class ResetDailyHandler : IRequestHandler<ResetDailyRequest, ResetDailyResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IQueueRepository _queueRepository;

        public ResetDailyHandler(
            IUnitOfWork unitOfWork,
            IEmployeeRepository employeeRepository,
            IQueueRepository queueRepository)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _queueRepository = queueRepository;
        }

        public async Task<ResetDailyResponse> Handle(ResetDailyRequest request, CancellationToken cancellationToken)
        {
            // Get all active employees
            var activeEmployees = await _employeeRepository.GetAll(cancellationToken);
            var employeesToQueue = activeEmployees
                .Where(e => e.Status == EmployeeStatus.Active && !e.IsDeleted)
                .OrderBy(e => e.CreatedDate)
                .ToList();

            // Delete existing queues for the date
            var existingQueues = await _queueRepository.GetByDateAsync(request.Date, cancellationToken);
            foreach (var queue in existingQueues)
            {
                _queueRepository.Delete(queue);
            }

            // Create new queues
            int position = 1;
            foreach (var employee in employeesToQueue)
            {
                var queue = new Domain.Entities.Queue
                {
                    EmployeeId = employee.Id,
                    Position = position++,
                    Status = QueueStatus.Active,
                    QueueDate = request.Date.Date
                };
                _queueRepository.Create(queue);
            }

            await _unitOfWork.Save(cancellationToken);

            return new ResetDailyResponse(employeesToQueue.Count, request.Date.Date);
        }
    }
}

