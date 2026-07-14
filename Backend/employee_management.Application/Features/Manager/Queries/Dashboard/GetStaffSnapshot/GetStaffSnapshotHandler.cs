using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository.QueuesRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetStaffSnapshot
{
    public sealed class GetStaffSnapshotHandler : IRequestHandler<GetStaffSnapshotRequest, GetStaffSnapshotResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IJobRepository _jobRepository;
        private readonly IQueueRepository _queueRepository;
        private readonly IEmployeeStatusHistoryRepository _statusHistoryRepository;

        public GetStaffSnapshotHandler(
            IEmployeeRepository employeeRepository,
            IJobRepository jobRepository,
            IQueueRepository queueRepository,
            IEmployeeStatusHistoryRepository statusHistoryRepository)
        {
            _employeeRepository = employeeRepository;
            _jobRepository = jobRepository;
            _queueRepository = queueRepository;
            _statusHistoryRepository = statusHistoryRepository;
        }

        public async Task<GetStaffSnapshotResponse> Handle(GetStaffSnapshotRequest request, CancellationToken cancellationToken)
        {
            var staff = await _employeeRepository.GetStaffWithAvailabilityAsync(cancellationToken);

            var today = DateTime.Today;
            var utcToday = DateTime.SpecifyKind(today, DateTimeKind.Utc);
            var utcTodayEnd = DateTime.SpecifyKind(today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            var now = DateTimeOffset.UtcNow;

            // Fetch shared data once (avoid per-employee N+1 queries).
            var allJobs = await _jobRepository.GetJobsByStatusAsync(null, null, null, cancellationToken);
            var todayJobs = await _jobRepository.GetJobsByStatusAsync(null, utcToday, utcTodayEnd, cancellationToken);
            var todayQueues = await _queueRepository.GetByDateAsync(today, cancellationToken);
            var latestStatusByEmployee = await _statusHistoryRepository.GetLatestPerEmployeeAsync(
                staff.Select(e => e.Id), cancellationToken);

            // Current availability per employee from today's queue roster.
            var availabilityByEmployee = todayQueues
                .GroupBy(q => q.EmployeeId)
                .ToDictionary(g => g.Key, g => g.First().AvailabilityStatus);

            var activeJobsByEmployee = allJobs
                .Where(j => j.Status == JobStatus.Assigned || j.Status == JobStatus.InProgress)
                .GroupBy(j => j.AssigneeId)
                .ToDictionary(g => g.Key, g => g.Count());

            var todayJobsByEmployee = todayJobs
                .GroupBy(j => j.AssigneeId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var staffSnapshots = new List<StaffSnapshotDto>();

            foreach (var employee in staff)
            {
                var employeeTodayJobs = todayJobsByEmployee.TryGetValue(employee.Id, out var jobs)
                    ? jobs
                    : new List<Domain.Entities.Job>();

                var todayHandled = employeeTodayJobs.Count(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost);
                var todayWon = employeeTodayJobs.Count(j => j.Status == JobStatus.ClosedWon);

                var categoryTags = employeeTodayJobs
                    .Where(j => j.Status == JobStatus.ClosedWon && !string.IsNullOrEmpty(j.Category))
                    .GroupBy(j => j.Category)
                    .OrderByDescending(g => g.Count())
                    .Take(3)
                    .Select(g => g.Key)
                    .ToList();

                var activeLoad = activeJobsByEmployee.TryGetValue(employee.Id, out var load) ? load : 0;

                // Current availability status from today's queue (Unavailable if not in today's roster).
                var availabilityStatus = availabilityByEmployee.TryGetValue(employee.Id, out var status)
                    ? status
                    : AvailabilityStatus.Unavailable;

                // Time in current status: only trust the latest history entry when it actually
                // records a change INTO the status the employee is currently in (otherwise the
                // duration would belong to a different, superseded status).
                var timeInCurrentStatus = TimeSpan.Zero;
                if (latestStatusByEmployee.TryGetValue(employee.Id, out var latestChange)
                    && latestChange.NewStatus == availabilityStatus
                    && latestChange.ChangedDate <= now)
                {
                    timeInCurrentStatus = now - latestChange.ChangedDate;
                }

                staffSnapshots.Add(new StaffSnapshotDto(
                    employee.Id,
                    employee.Name,
                    availabilityStatus,
                    timeInCurrentStatus,
                    activeLoad,
                    todayHandled,
                    todayWon,
                    categoryTags
                ));
            }

            return new GetStaffSnapshotResponse(staffSnapshots);
        }
    }
}
