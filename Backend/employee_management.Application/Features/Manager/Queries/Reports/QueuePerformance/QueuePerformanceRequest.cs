using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Reports.QueuePerformance
{
    public sealed record QueuePerformanceRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<QueuePerformanceResponse>;
}
