using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.EmployeeStatusHistory.Queries.GetHistory
{
    public sealed record GetHistoryRequest(
        Guid? EmployeeId = null,
        DateTime? StartDate = null,
        DateTime? EndDate = null,
        ChangeReason? ChangeReason = null
    ) : IRequest<GetHistoryResponse>;
}

