using AutoMapper;
using MediatR;
using employee_management.Application.Repository.JobsRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.GetMyTasks
{
    public sealed class GetMyTasksHandler : IRequestHandler<GetMyTasksRequest, GetMyTasksResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetMyTasksHandler> _logger;

        public GetMyTasksHandler(IJobRepository jobRepository, IMapper mapper, ILogger<GetMyTasksHandler> logger)
        {
            _jobRepository = jobRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<GetMyTasksResponse> Handle(GetMyTasksRequest request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving tasks for employee with Id: {EmployeeId}", request.EmployeeId);

            try
            {
                var jobs = await _jobRepository.GetMyTasksAsync(request.EmployeeId, cancellationToken);
                
                var jobDtos = _mapper.Map<List<JobDto>>(jobs);

                _logger.LogInformation("Retrieved {Count} tasks for employee with Id: {EmployeeId}", jobDtos.Count, request.EmployeeId);

                return new GetMyTasksResponse(jobDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks for employee with Id: {EmployeeId}", request.EmployeeId);
                throw;
            }
        }
    }
}

