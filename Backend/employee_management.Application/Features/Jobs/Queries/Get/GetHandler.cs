using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository.JobsRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.Get
{
    public sealed class GetHandler : IRequestHandler<GetRequest, JobGetResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetHandler> _logger;

        public GetHandler(IJobRepository jobRepository, IMapper mapper, ILogger<GetHandler> logger)
        {
            _jobRepository = jobRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<JobGetResponse> Handle(GetRequest request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving job with Id: {JobId}", request.Id);

            try
            {
                var job = await _jobRepository.Get(request.Id, cancellationToken);
                if (job == null)
                {
                    _logger.LogWarning("Job with Id: {JobId} not found", request.Id);
                    throw new NoDataFoundException($"Job with Id {request.Id} not found.");
                }

                _logger.LogInformation("Job with Id: {JobId} retrieved successfully", request.Id);

                return _mapper.Map<JobGetResponse>(job);
            }
            catch (NoDataFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving job with Id: {JobId}", request.Id);
                throw;
            }
        }
    }
}

