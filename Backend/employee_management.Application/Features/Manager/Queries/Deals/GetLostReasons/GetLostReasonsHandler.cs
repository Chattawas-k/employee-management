using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Deals.GetLostReasons
{
    public sealed class GetLostReasonsHandler : IRequestHandler<GetLostReasonsRequest, GetLostReasonsResponse>
    {
        private readonly IJobRepository _jobRepository;

        public GetLostReasonsHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<GetLostReasonsResponse> Handle(GetLostReasonsRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(-30), DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var jobs = await _jobRepository.GetJobsByStatusAsync(JobStatus.ClosedLost, dateFrom, dateTo, cancellationToken);
            var lostJobs = jobs.Where(j => j.Report != null).ToList();

            // Extract reasons from Report.Reasons
            var reasonCounts = new Dictionary<string, int>();

            foreach (var job in lostJobs)
            {
                if (job.Report?.Reasons != null && job.Report.Reasons.Any())
                {
                    foreach (var reason in job.Report.Reasons)
                    {
                        if (!reasonCounts.ContainsKey(reason))
                        {
                            reasonCounts[reason] = 0;
                        }
                        reasonCounts[reason]++;
                    }
                }
                else
                {
                    // If no reasons, use "ไม่ระบุเหตุผล"
                    var defaultReason = "ไม่ระบุเหตุผล";
                    if (!reasonCounts.ContainsKey(defaultReason))
                    {
                        reasonCounts[defaultReason] = 0;
                    }
                    reasonCounts[defaultReason]++;
                }
            }

            var totalLost = lostJobs.Count;
            var reasons = reasonCounts.Select(kvp => new LostReasonSummary(
                kvp.Key,
                kvp.Value,
                totalLost > 0 ? (double)kvp.Value / totalLost * 100 : 0
            )).OrderByDescending(r => r.Count).ToList();

            return new GetLostReasonsResponse(reasons);
        }
    }
}
