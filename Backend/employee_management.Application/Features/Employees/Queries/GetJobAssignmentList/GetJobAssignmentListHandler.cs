using MediatR;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Queries.GetJobAssignmentList
{
    public sealed class GetJobAssignmentListHandler : IRequestHandler<GetJobAssignmentListRequest, List<GetJobAssignmentListResponse>>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IJobRepository _jobRepository;
        private readonly ILogger<GetJobAssignmentListHandler> _logger;

        public GetJobAssignmentListHandler(
            IEmployeeRepository employeeRepository,
            IJobRepository jobRepository,
            ILogger<GetJobAssignmentListHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _jobRepository = jobRepository;
            _logger = logger;
        }

        public async Task<List<GetJobAssignmentListResponse>> Handle(GetJobAssignmentListRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var employees = await _employeeRepository.GetJobAssignmentListAsync(request.Keyword, cancellationToken);

                if (!employees.Any())
                {
                    return new List<GetJobAssignmentListResponse>();
                }

                // Get active job counts for all employees
                var employeeIds = employees.Select(e => e.Id).ToList();
                var allJobs = await _jobRepository.GetAll(cancellationToken);
                var activeJobCounts = allJobs
                    .Where(j => !j.IsDeleted && 
                               employeeIds.Contains(j.AssigneeId) &&
                               (j.Status == JobStatus.Pending || j.Status == JobStatus.InProgress))
                    .GroupBy(j => j.AssigneeId)
                    .ToDictionary(g => g.Key, g => g.Count());

                // Map employees to responses with job counts
                var responses = employees.Select(employee =>
                {
                    var activeTasks = activeJobCounts.GetValueOrDefault(employee.Id, 0);
                    var status = CalculateStatus(employee, activeTasks);
                    var statusClass = CalculateStatusClass(status);

                    return new GetJobAssignmentListResponse(
                        employee.Id,
                        employee.Name,
                        employee.Position?.Name ?? string.Empty,
                        employee.Avatar,
                        status,
                        statusClass,
                        activeTasks,
                        0 // Will be calculated below
                    );
                }).ToList();

                // Calculate queue positions for ready employees
                var readyEmployees = responses
                    .Where(r => r.Status == "พร้อมรับงาน")
                    .OrderBy(r => r.Name)
                    .ToList();

                for (int i = 0; i < readyEmployees.Count; i++)
                {
                    var employee = readyEmployees[i];
                    var index = responses.FindIndex(r => r.Id == employee.Id);
                    if (index >= 0)
                    {
                        responses[index] = employee with { QueuePosition = i + 1 };
                    }
                }

                return responses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving job assignment list with keyword: {Keyword}", request.Keyword);
                throw;
            }
        }

        private static string CalculateStatus(Domain.Entities.Employee employee, int activeTasks)
        {
            if (employee.Status == EmployeeStatus.Inactive)
            {
                return "พัก/ลางาน";
            }

            if (activeTasks == 0)
            {
                return "พร้อมรับงาน";
            }

            return "ติดลูกค้า";
        }

        private static string CalculateStatusClass(string status)
        {
            return status switch
            {
                "พร้อมรับงาน" => "bg-green-100 text-green-800",
                "ติดลูกค้า" => "bg-orange-100 text-orange-800",
                "พัก/ลางาน" => "bg-gray-100 text-gray-800",
                _ => "bg-gray-100 text-gray-800"
            };
        }
    }
}

