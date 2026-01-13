using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Manager.Queries.Deals.GetDeals
{
    public sealed record GetDealsResponse(
        List<DealDto> Deals
    );

    public sealed record DealDto(
        Guid Id,
        string JobNumber,
        string? JobRunningCode,
        string Customer,
        string Channel,
        string Category,
        Guid StaffId,
        string StaffName,
        JobStatus Outcome,
        decimal? SaleValue,
        DateTimeOffset CreatedDate,
        DateTimeOffset? ClosedDate
    );
}
