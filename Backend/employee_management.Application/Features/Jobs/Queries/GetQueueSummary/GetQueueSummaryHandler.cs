using AutoMapper;
using MediatR;
using employee_management.Application.Repository.JobsRepository;

namespace employee_management.Application.Features.Jobs.Queries.GetQueueSummary
{
    public sealed class GetQueueSummaryHandler : IRequestHandler<GetQueueSummaryRequest, GetQueueSummaryResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IMapper _mapper;

        public GetQueueSummaryHandler(
            IJobRepository jobRepository,
            IMapper mapper)
        {
            _jobRepository = jobRepository;
            _mapper = mapper;
        }

        public async Task<GetQueueSummaryResponse> Handle(GetQueueSummaryRequest request, CancellationToken cancellationToken)
        {
            // Bangkok = UTC+7; define the day boundaries as DateTimeOffset so the
            // comparison works correctly regardless of how jobs were stored.
            var bangkokOffset = TimeSpan.FromHours(7);
            var targetDate = request.Date.Date;
            var dayStart = new DateTimeOffset(targetDate, bangkokOffset);           // e.g. 2026-03-20 00:00 +07:00
            var dayEnd   = new DateTimeOffset(targetDate.AddDays(1), bangkokOffset); // e.g. 2026-03-21 00:00 +07:00

            // GetJobsByStatusAsync strips the time component internally (uses .Date as UTC
            // midnight), so it cannot represent Bangkok-offset boundaries. Load all jobs
            // and filter in-memory instead.
            var allJobs = await _jobRepository.GetAllJobsAsync(cancellationToken);
            var jobs = allJobs
                .Where(j => j.CreatedDate >= dayStart && j.CreatedDate < dayEnd)
                .ToList();

            // Map to DTOs
            var jobDtos = _mapper.Map<List<QueueSummaryJobDto>>(jobs);

            return new GetQueueSummaryResponse(jobDtos);
        }
    }
}

