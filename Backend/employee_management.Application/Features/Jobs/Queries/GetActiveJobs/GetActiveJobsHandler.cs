using MediatR;
using employee_management.Application.Repository.JobsRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.GetActiveJobs
{
    public sealed class GetActiveJobsHandler : IRequestHandler<GetActiveJobsRequest, GetActiveJobsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly ILogger<GetActiveJobsHandler> _logger;

        public GetActiveJobsHandler(IJobRepository jobRepository, ILogger<GetActiveJobsHandler> logger)
        {
            _jobRepository = jobRepository;
            _logger = logger;
        }

        public async Task<GetActiveJobsResponse> Handle(GetActiveJobsRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var jobs = await _jobRepository.GetActiveJobsAsync(request.AssigneeId, request.Search, cancellationToken);

                var dtos = jobs.Select(j => new ActiveJobDto
                {
                    Id = j.Id,
                    JobNumber = j.JobNumber,
                    JobRunningCode = j.JobRunningCode,
                    Title = j.Title,
                    Customer = j.Customer,
                    Description = j.Description,
                    Channel = j.Channel,
                    AssigneeId = j.AssigneeId,
                    AssigneeName = j.Employee?.Name,
                    AssigneeAvatar = j.Employee?.Avatar,
                    Status = j.Status,
                    Priority = j.Priority,
                    IsEscalated = j.IsEscalated,
                    CreatedDate = j.CreatedDate,
                    AssignedDate = j.AssignedDate,
                    StartedDate = j.StartedDate
                }).ToList();

                return new GetActiveJobsResponse
                {
                    Jobs = dtos,
                    TotalCount = dtos.Count
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active jobs");
                throw;
            }
        }
    }
}
