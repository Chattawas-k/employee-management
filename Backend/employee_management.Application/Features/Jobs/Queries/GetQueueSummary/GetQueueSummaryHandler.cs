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
            // Get all jobs (for all employees)
            var jobs = await _jobRepository.GetAllJobsAsync(cancellationToken);

            // Map to DTOs
            var jobDtos = _mapper.Map<List<QueueSummaryJobDto>>(jobs);

            return new GetQueueSummaryResponse(jobDtos);
        }
    }
}

