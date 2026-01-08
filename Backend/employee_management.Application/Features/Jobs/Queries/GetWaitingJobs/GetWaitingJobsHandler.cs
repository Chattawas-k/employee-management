using MediatR;
using employee_management.Application.Repository.WaitingJobsRepository;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.GetWaitingJobs
{
    public sealed class GetWaitingJobsHandler : IRequestHandler<GetWaitingJobsRequest, GetWaitingJobsResponse>
    {
        private readonly IWaitingJobRepository _waitingJobRepository;
        private readonly ILogger<GetWaitingJobsHandler> _logger;

        public GetWaitingJobsHandler(
            IWaitingJobRepository waitingJobRepository,
            ILogger<GetWaitingJobsHandler> logger)
        {
            _waitingJobRepository = waitingJobRepository;
            _logger = logger;
        }

        public async Task<GetWaitingJobsResponse> Handle(GetWaitingJobsRequest request, CancellationToken cancellationToken)
        {
            var waitingJobs = await _waitingJobRepository.GetPendingWaitingJobsAsync(cancellationToken);

            var waitingJobDtos = waitingJobs.Select(w => new WaitingJobDto
            {
                Id = w.Id,
                JobId = w.JobId,
                CustomerName = w.CustomerName,
                Title = w.Title,
                Priority = w.Priority.ToString(),
                CreatedDate = w.CreatedDate.DateTime
            }).ToList();

            return new GetWaitingJobsResponse
            {
                WaitingJobs = waitingJobDtos
            };
        }
    }
}

