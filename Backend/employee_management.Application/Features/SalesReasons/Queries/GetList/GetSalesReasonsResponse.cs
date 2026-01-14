using employee_management.Application.Features.SalesReasons.Models;

namespace employee_management.Application.Features.SalesReasons.Queries.GetList
{
    public sealed record GetSalesReasonsResponse(
        List<SalesReasonDto> Reasons
    );
}

