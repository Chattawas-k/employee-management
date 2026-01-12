using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Queries.GetMyStatusHistory
{
    public sealed record GetMyStatusHistoryRequest(
        Guid EmployeeId,
        DateTime? StartDate,
        DateTime? EndDate,
        JobChangeSource? ChangeSource,
        Guid? JobId,
        int Skip = 0,
        int Take = 50
    ) : IRequest<GetMyStatusHistoryResponse>;
}

