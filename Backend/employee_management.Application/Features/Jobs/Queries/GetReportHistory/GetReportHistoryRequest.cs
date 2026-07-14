using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.GetReportHistory
{
    public sealed record GetReportHistoryRequest(
        Guid JobId
    ) : IRequest<GetReportHistoryResponse>;
}
