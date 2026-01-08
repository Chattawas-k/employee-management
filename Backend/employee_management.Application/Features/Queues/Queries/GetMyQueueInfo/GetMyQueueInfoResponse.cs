namespace employee_management.Application.Features.Queues.Queries.GetMyQueueInfo
{
    public record GetMyQueueInfoResponse
    {
        public int MyQueuePosition { get; init; }
        public int QueuesRemaining { get; init; }
        public CurrentlyServingDto? CurrentlyServing { get; init; }
        public bool IsInQueue { get; init; }
        public string QueueStatus { get; init; } = string.Empty; // "Active", "Busy", "Inactive"
    }

    public record CurrentlyServingDto
    {
        public string Name { get; init; } = string.Empty;
        public int QueuePosition { get; init; }
        public string? AvatarUrl { get; init; }
    }
}

