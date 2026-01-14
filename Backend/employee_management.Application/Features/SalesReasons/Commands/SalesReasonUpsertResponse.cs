using employee_management.Domain.Enums;

namespace employee_management.Application.Features.SalesReasons.Commands
{
    public sealed record SalesReasonUpsertResponse(
        Guid Id,
        SalesReasonType Type,
        string Label,
        bool IsActive,
        int SortOrder
    );
}

