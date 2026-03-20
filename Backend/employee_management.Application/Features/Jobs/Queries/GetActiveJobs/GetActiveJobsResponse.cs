using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Queries.GetActiveJobs
{
    public sealed class GetActiveJobsResponse
    {
        public List<ActiveJobDto> Jobs { get; set; } = new();
        public int TotalCount { get; set; }
    }

    public sealed class ActiveJobDto
    {
        public Guid Id { get; set; }
        public string JobNumber { get; set; } = string.Empty;
        public string? JobRunningCode { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public Guid AssigneeId { get; set; }
        public string? AssigneeName { get; set; }
        public string? AssigneeAvatar { get; set; }
        public JobStatus Status { get; set; }
        public JobPriority Priority { get; set; }
        public bool IsEscalated { get; set; }
        public DateTimeOffset CreatedDate { get; set; }
        public DateTime? AssignedDate { get; set; }
        public DateTime? StartedDate { get; set; }
    }
}
