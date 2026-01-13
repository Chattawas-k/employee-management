using MediatR;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Queues.Queries.GetMyQueueInfo
{
    public sealed class GetMyQueueInfoHandler : IRequestHandler<GetMyQueueInfoRequest, GetMyQueueInfoResponse>
    {
        private readonly IQueueRepository _queueRepository;
        private readonly IBusinessDateTimeProvider _dateTimeProvider;
        private readonly ILogger<GetMyQueueInfoHandler> _logger;

        public GetMyQueueInfoHandler(
            IQueueRepository queueRepository,
            IBusinessDateTimeProvider dateTimeProvider,
            ILogger<GetMyQueueInfoHandler> logger)
        {
            _queueRepository = queueRepository;
            _dateTimeProvider = dateTimeProvider;
            _logger = logger;
        }

        public async Task<GetMyQueueInfoResponse> Handle(GetMyQueueInfoRequest request, CancellationToken cancellationToken)
        {
            var today = _dateTimeProvider.GetBangkokTodayDate();

            // Get current employee's queue entry
            var myQueue = await _queueRepository.GetByEmployeeIdAndDateAsync(request.EmployeeId, today, cancellationToken);

            if (myQueue == null)
            {
                // Employee is not in queue
                return new GetMyQueueInfoResponse
                {
                    MyQueuePosition = 0,
                    QueuesRemaining = 0,
                    CurrentlyServing = null,
                    IsInQueue = false,
                    QueueStatus = string.Empty,
                    AvailabilityStatus = string.Empty
                };
            }

            // Get all queues for today, ordered by position
            var allQueues = await _queueRepository.GetByDateAsync(today, cancellationToken);
            var myPosition = myQueue.Position;

            // Calculate queues remaining (number of people before me with Active status)
            var queuesRemaining = allQueues
                .Where(q => q.Position < myPosition && q.Status == QueueStatus.Active && !q.IsDeleted)
                .Count();

            // Find currently serving person (first person with Active or Busy status, lowest position)
            CurrentlyServingDto? currentlyServing = null;
            var servingQueue = allQueues
                .Where(q => (q.Status == QueueStatus.Active || q.Status == QueueStatus.Busy) && !q.IsDeleted)
                .OrderBy(q => q.Position)
                .FirstOrDefault();

            if (servingQueue != null && servingQueue.Employee != null)
            {
                var employee = servingQueue.Employee;
                var fullName = $"{employee.Name}";
                
                // Generate avatar URL if not provided
                var avatarUrl = employee.Avatar;
                if (string.IsNullOrEmpty(avatarUrl))
                {
                    // Generate avatar from name (first character)
                    var firstChar = !string.IsNullOrEmpty(employee.Name) 
                        ? employee.Name.Substring(0, 1).ToUpper() 
                        : "?";
                    // In a real implementation, you might use a service to generate avatar URLs
                    // For now, we'll leave it null and let frontend handle it
                    avatarUrl = null;
                }

                currentlyServing = new CurrentlyServingDto
                {
                    Name = fullName,
                    QueuePosition = servingQueue.Position,
                    AvatarUrl = avatarUrl
                };
            }

            return new GetMyQueueInfoResponse
            {
                MyQueuePosition = myPosition,
                QueuesRemaining = queuesRemaining,
                CurrentlyServing = currentlyServing,
                IsInQueue = true,
                QueueStatus = myQueue.Status.ToString(), // "Active", "Busy", "Inactive" (for backward compatibility)
                AvailabilityStatus = myQueue.AvailabilityStatus.ToString() // "Available", "Busy", "Break", "Unavailable"
            };
        }
    }
}

