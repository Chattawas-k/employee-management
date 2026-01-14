using MediatR;
using employee_management.Domain.Enums;
using employee_management.Application.Features.SalesReasons.Models;

namespace employee_management.Application.Features.SalesReasons.Queries.GetList
{
    public sealed record GetSalesReasonsRequest(
        SalesReasonType Type,
        bool IncludeInactive = false
    ) : IRequest<GetSalesReasonsResponse>;
}

