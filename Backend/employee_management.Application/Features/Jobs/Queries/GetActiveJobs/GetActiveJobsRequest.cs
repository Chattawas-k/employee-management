using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.GetActiveJobs
{
    public sealed class GetActiveJobsRequest : IRequest<GetActiveJobsResponse>
    {
        public Guid? AssigneeId { get; set; }
        public string? Search { get; set; }
    }
}
