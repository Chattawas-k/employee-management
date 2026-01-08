namespace employee_management.Application.Features.Jobs.Queries.GetWaitingJobs
{
    public record GetWaitingJobsResponse
    {
        public List<WaitingJobDto> WaitingJobs { get; init; } = new();
    }

    public record WaitingJobDto
    {
        public Guid Id { get; init; }
        public Guid JobId { get; init; }
        public string CustomerName { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public string Priority { get; init; } = string.Empty;
        public DateTime CreatedDate { get; init; }
    }
}

