using MediatR;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Deals.GetDeals
{
    public sealed class GetDealsHandler : IRequestHandler<GetDealsRequest, GetDealsResponse>
    {
        private readonly IJobRepository _jobRepository;

        public GetDealsHandler(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<GetDealsResponse> Handle(GetDealsRequest request, CancellationToken cancellationToken)
        {
            // Convert to UTC to avoid DateTimeOffset errors
            var dateFrom = request.DateFrom.HasValue
                ? DateTime.SpecifyKind(request.DateFrom.Value.Date, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
            var dateTo = request.DateTo.HasValue
                ? DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.Today.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var jobs = await _jobRepository.GetJobsByStatusAsync(null, dateFrom, dateTo, cancellationToken);

            // Apply filters
            if (request.StaffId.HasValue)
            {
                jobs = jobs.Where(j => j.AssigneeId == request.StaffId.Value).ToList();
            }

            if (!string.IsNullOrEmpty(request.Category))
            {
                jobs = jobs.Where(j => j.Category == request.Category).ToList();
            }

            if (!string.IsNullOrEmpty(request.Channel))
            {
                jobs = jobs.Where(j => j.Channel == request.Channel).ToList();
            }

            if (request.Outcome.HasValue)
            {
                jobs = jobs.Where(j => j.Status == request.Outcome.Value).ToList();
            }

            var deals = jobs.Select(j => new DealDto(
                j.Id,
                j.JobNumber,
                j.JobRunningCode,
                j.Customer,
                j.Channel,
                j.Category,
                j.AssigneeId,
                j.Employee?.Name ?? "Unknown",
                j.Status,
                j.Report != null && j.Report.SalesStatus.ToLower() == "success" && 
                    decimal.TryParse(j.Report.Description, out var amount) ? amount : (decimal?)null,
                j.CreatedDate,
                j.ClosedDate
            )).ToList();

            return new GetDealsResponse(deals);
        }
    }
}
