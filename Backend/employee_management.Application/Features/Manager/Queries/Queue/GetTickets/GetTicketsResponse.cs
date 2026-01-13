using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Queue.GetTickets
{
    public sealed record GetTicketsResponse(
        List<TicketDto> Tickets,
        int TotalCount,
        int PageNumber,
        int PageSize,
        int TotalPages
    );

    public sealed record TicketDto(
        Guid Id,
        string JobNumber,
        string? JobRunningCode,
        string Customer,
        string Channel,
        string Category,
        JobStatus Status,
        JobPriority Priority,
        Guid? AssignedStaffId,
        string? AssignedStaffName,
        DateTimeOffset CreatedDate,
        DateTime? AssignedDate,
        DateTime? StartedDate,
        DateTime? ClosedDate,
        TimeSpan WaitTime,
        bool IsSlaAtRisk,
        bool IsEscalated
    );
}
