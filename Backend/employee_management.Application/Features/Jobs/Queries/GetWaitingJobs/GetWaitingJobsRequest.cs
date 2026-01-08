using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.GetWaitingJobs
{
    public record GetWaitingJobsRequest : IRequest<GetWaitingJobsResponse>
    {
    }
}

