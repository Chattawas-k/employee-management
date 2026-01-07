using AutoMapper;
using MediatR;
using employee_management.Application.Repository.JobsRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.GetSalesReports
{
    public sealed class GetSalesReportsHandler : IRequestHandler<GetSalesReportsRequest, GetSalesReportsResponse>
    {
        private readonly IJobRepository _jobRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetSalesReportsHandler> _logger;

        public GetSalesReportsHandler(
            IJobRepository jobRepository, 
            IMapper mapper, 
            ILogger<GetSalesReportsHandler> logger)
        {
            _jobRepository = jobRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<GetSalesReportsResponse> Handle(GetSalesReportsRequest request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Starting to retrieve sales reports for UserId: {UserId}, Status: {Status}", 
                    request.UserId, request.Status ?? "All");
                var jobs = await _jobRepository.GetSalesReportsAsync(request.UserId, request.Status, cancellationToken);
                _logger.LogInformation("Retrieved {Count} jobs from repository", jobs.Count);
                
                // Log details about each job
                foreach (var job in jobs)
                {
                    _logger.LogInformation("Job {JobId}: ReportJson is null: {IsNull}, Report is null: {ReportIsNull}", 
                        job.Id, 
                        string.IsNullOrWhiteSpace(job.ReportJson), 
                        job.Report == null);
                }
                
                // Filter out jobs without reports and map
                var jobsWithReports = jobs.Where(j => j.Report != null).ToList();
                _logger.LogInformation("Found {Count} jobs with reports", jobsWithReports.Count);
                
                List<SalesReportDto> reportDtos;
                try
                {
                    reportDtos = _mapper.Map<List<SalesReportDto>>(jobsWithReports);
                    _logger.LogInformation("Mapped {Count} sales report DTOs", reportDtos.Count);
                }
                catch (Exception mapEx)
                {
                    _logger.LogError(mapEx, "Error mapping jobs to sales report DTOs");
                    throw;
                }

                return new GetSalesReportsResponse(reportDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sales reports");
                throw;
            }
        }
    }
}

