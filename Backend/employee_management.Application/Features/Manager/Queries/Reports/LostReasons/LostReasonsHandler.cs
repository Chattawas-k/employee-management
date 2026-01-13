using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Reports.LostReasons
{
    public sealed class LostReasonsHandler : IRequestHandler<LostReasonsRequest, LostReasonsResponse>
    {
        private readonly IJobRepository _jobRepository;

        public LostReasonsHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<LostReasonsResponse> Handle(LostReasonsRequest request, CancellationToken cancellationToken)
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
            var reasonGroups = new Dictionary<string, List<Domain.Entities.Job>>();

            foreach (var job in lostJobs)
            {
                if (job.Report?.Reasons != null && job.Report.Reasons.Any())
                {
                    foreach (var reason in job.Report.Reasons)
                    {
                        if (!reasonGroups.ContainsKey(reason))
                        {
                            reasonGroups[reason] = new List<Domain.Entities.Job>();
                        }
                        reasonGroups[reason].Add(job);
                    }
                }
                else
                {
                    // If no reasons, use "ไม่ระบุเหตุผล"
                    var defaultReason = "ไม่ระบุเหตุผล";
                    if (!reasonGroups.ContainsKey(defaultReason))
                    {
                        reasonGroups[defaultReason] = new List<Domain.Entities.Job>();
                    }
                    reasonGroups[defaultReason].Add(job);
                }
            }

            var totalLost = lostJobs.Count;
            var reasons = reasonGroups.Select(kvp => new LostReasonItem(
                kvp.Key,
                kvp.Value.Count,
                totalLost > 0 ? (double)kvp.Value.Count / totalLost * 100 : 0,
                kvp.Value.Select(j => 
                {
                    DateTimeOffset closedDate;
                    if (j.ClosedDate.HasValue)
                    {
                        var utcClosedDate = DateTime.SpecifyKind(j.ClosedDate.Value, DateTimeKind.Utc);
                        closedDate = new DateTimeOffset(utcClosedDate, TimeSpan.Zero);
                    }
                    else
                    {
                        closedDate = j.UpdatedDate ?? j.CreatedDate;
                    }
                    return new LostReasonDetail(
                        j.Id,
                        j.JobNumber,
                        j.JobRunningCode,
                        j.Customer,
                        j.Employee?.Name ?? "Unknown",
                        closedDate
                    );
                }).ToList()
            )).OrderByDescending(r => r.Count).ToList();

            return new LostReasonsResponse(reasons);
        }
    }
}
