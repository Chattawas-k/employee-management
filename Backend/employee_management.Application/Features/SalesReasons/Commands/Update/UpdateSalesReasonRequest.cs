using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.SalesReasons.Commands.Update
{
    public sealed record UpdateSalesReasonRequest(
        Guid Id,
        SalesReasonType Type,
        string Label,
        bool IsActive,
        int SortOrder
    ) : IRequest<SalesReasonUpsertResponse>;
}

