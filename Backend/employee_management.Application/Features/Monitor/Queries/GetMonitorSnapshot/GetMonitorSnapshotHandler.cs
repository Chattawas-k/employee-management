using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Monitor.Queries.GetMonitorSnapshot
{
    public sealed class GetMonitorSnapshotHandler : IRequestHandler<GetMonitorSnapshotRequest, GetMonitorSnapshotResponse>
    {
        private readonly IQueueRepository _queueRepository;
        private readonly IJobRepository _jobRepository;

        public GetMonitorSnapshotHandler(
            IQueueRepository queueRepository,
            IJobRepository jobRepository)
        {
            _queueRepository = queueRepository;
            _jobRepository = jobRepository;
        }

        public async Task<GetMonitorSnapshotResponse> Handle(GetMonitorSnapshotRequest request, CancellationToken cancellationToken)
        {
            var date = request.Date.Date;

            var queues = await _queueRepository.GetByDateAsync(date, cancellationToken);

            // Active = waiting list (ready queue)
            var activeQueues = queues
                .Where(q => !q.IsDeleted && q.Status == QueueStatus.Active)
                .OrderBy(q => q.Position)
                .ToList();

            MonitorStaffItem? nextQueue = null;
            var waitingList = new List<MonitorStaffItem>();

            if (activeQueues.Count > 0)
            {
                var first = activeQueues[0];
                nextQueue = new MonitorStaffItem(
                    EmployeeId: first.EmployeeId,
                    EmployeeName: first.Employee?.Name ?? string.Empty,
                    QueuePosition: 1
                );

                // Remaining active queues are waiting list (relative positions 1..n like UI)
                for (var i = 1; i < activeQueues.Count; i++)
                {
                    var q = activeQueues[i];
                    waitingList.Add(new MonitorStaffItem(
                        EmployeeId: q.EmployeeId,
                        EmployeeName: q.Employee?.Name ?? string.Empty,
                        QueuePosition: i // relative position for UI (starts at 1)
                    ));
                }
            }

            // Busy = serving now
            var busyQueues = queues
                .Where(q => !q.IsDeleted && q.Status == QueueStatus.Busy)
                .OrderBy(q => q.Position)
                .ToList();

            // Find in-progress jobs for job number display (best-effort)
            // Using GetJobsByStatusAsync without date filters: show "serving" even if job created earlier.
            var inProgressJobs = await _jobRepository.GetJobsByStatusAsync(
                status: JobStatus.InProgress,
                dateFrom: null,
                dateTo: null,
                cancellationToken: cancellationToken);

            var jobsByAssignee = inProgressJobs
                .Where(j => !j.IsDeleted && j.AssigneeId != Guid.Empty)
                .GroupBy(j => j.AssigneeId)
                .ToDictionary(
                    g => g.Key,
                    g => g
                        .OrderByDescending(j => j.UpdatedDate ?? j.CreatedDate)
                        .FirstOrDefault());

            var servingNow = busyQueues.Select(q =>
            {
                jobsByAssignee.TryGetValue(q.EmployeeId, out var job);
                return new MonitorServingItem(
                    EmployeeId: q.EmployeeId,
                    EmployeeName: q.Employee?.Name ?? string.Empty,
                    JobNumber: job?.JobNumber,
                    JobRunningCode: job?.JobRunningCode,
                    QueueStatus: q.Status,
                    AvailabilityStatus: q.AvailabilityStatus
                );
            }).ToList();

            var counts = new MonitorCounts(
                WaitingTotal: waitingList.Count,
                ServingTotal: servingNow.Count
            );

            return new GetMonitorSnapshotResponse(
                Date: date,
                GeneratedAt: DateTimeOffset.UtcNow,
                Counts: counts,
                NextQueue: nextQueue,
                WaitingList: waitingList,
                ServingNow: servingNow
            );
        }
    }
}

