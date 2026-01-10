using MediatR;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetStaffSnapshot
{
    public sealed class GetStaffSnapshotHandler : IRequestHandler<GetStaffSnapshotRequest, GetStaffSnapshotResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IJobRepository _jobRepository;

        public GetStaffSnapshotHandler(
            IEmployeeRepository employeeRepository,
            IJobRepository jobRepository)
        {
            _employeeRepository = employeeRepository;
            _jobRepository = jobRepository;
        }

        public async Task<GetStaffSnapshotResponse> Handle(GetStaffSnapshotRequest request, CancellationToken cancellationToken)
        {
            var staff = await _employeeRepository.GetStaffWithAvailabilityAsync(cancellationToken);
            var today = DateTime.Today;
            var utcToday = DateTime.SpecifyKind(today, DateTimeKind.Utc);
            var utcTodayEnd = DateTime.SpecifyKind(today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var staffSnapshots = new List<StaffSnapshotDto>();

            foreach (var employee in staff)
            {
                // Get active jobs for this employee
                var activeJobs = await _jobRepository.GetJobsByStatusAsync(null, null, null, cancellationToken);
                var employeeActiveJobs = activeJobs.Where(j => j.AssigneeId == employee.Id && 
                    (j.Status == JobStatus.Assigned || j.Status == JobStatus.InProgress)).ToList();

                // Get today's performance
                var todayJobs = await _jobRepository.GetJobsByStatusAsync(null, utcToday, utcTodayEnd, cancellationToken);
                var employeeTodayJobs = todayJobs.Where(j => j.AssigneeId == employee.Id).ToList();
                var todayHandled = employeeTodayJobs.Count(j => j.Status == JobStatus.ClosedWon || j.Status == JobStatus.ClosedLost);
                var todayWon = employeeTodayJobs.Count(j => j.Status == JobStatus.ClosedWon);

                // Get category tags (top categories from today's won jobs)
                var wonJobs = employeeTodayJobs.Where(j => j.Status == JobStatus.ClosedWon && !string.IsNullOrEmpty(j.Category));
                var categoryTags = wonJobs.GroupBy(j => j.Category)
                    .OrderByDescending(g => g.Count())
                    .Take(3)
                    .Select(g => g.Key)
                    .ToList();

                // Get time in current status (would need EmployeeStatusHistory, simplified for now)
                var timeInCurrentStatus = TimeSpan.Zero; // TODO: Calculate from EmployeeStatusHistory

                // Get availability status from Queue
                var availabilityStatus = AvailabilityStatus.Available; // TODO: Get from Queue entity

                staffSnapshots.Add(new StaffSnapshotDto(
                    employee.Id,
                    employee.Name,
                    availabilityStatus,
                    timeInCurrentStatus,
                    employeeActiveJobs.Count,
                    todayHandled,
                    todayWon,
                    categoryTags
                ));
            }

            return new GetStaffSnapshotResponse(staffSnapshots);
        }
    }
}
