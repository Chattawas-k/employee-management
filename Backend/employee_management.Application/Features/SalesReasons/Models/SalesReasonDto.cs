using employee_management.Domain.Enums;

namespace employee_management.Application.Features.SalesReasons.Models
{
    public sealed record SalesReasonDto(
        Guid Id,
        SalesReasonType Type,
        string Label,
        bool IsActive,
        int SortOrder
    );
}

