using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.SalesReasons.Commands.Create
{
    public sealed record CreateSalesReasonRequest(
        SalesReasonType Type,
        string Label,
        bool IsActive,
        int SortOrder
    ) : IRequest<SalesReasonUpsertResponse>;
}

