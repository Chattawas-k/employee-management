using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetQueueSnapshot
{
    public sealed class GetQueueSnapshotHandler : IRequestHandler<GetQueueSnapshotRequest, GetQueueSnapshotResponse>
    {
        private readonly IJobRepository _jobRepository;

        public GetQueueSnapshotHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<GetQueueSnapshotResponse> Handle(GetQueueSnapshotRequest request, CancellationToken cancellationToken)
        {
            var topWaitingJobs = await _jobRepository.GetTopWaitingJobsAsync(request.TopCount, cancellationToken);
            var now = DateTimeOffset.UtcNow;
            var nowDateTime = DateTime.UtcNow;

            var tickets = topWaitingJobs.Select(job =>
            {
                var waitTime = now - job.CreatedDate;
                var isSlaAtRisk = job.SlaWaitingBreachAt.HasValue && nowDateTime >= job.SlaWaitingBreachAt.Value;

                return new QueueSnapshotTicketDto(
                    job.Id,
                    job.JobNumber,
                    job.Customer,
                    job.Channel,
                    waitTime,
                    job.Priority,
                    job.Status,
                    job.Employee?.Name,
                    isSlaAtRisk
                );
            }).ToList();

            return new GetQueueSnapshotResponse(tickets);
        }
    }
}
