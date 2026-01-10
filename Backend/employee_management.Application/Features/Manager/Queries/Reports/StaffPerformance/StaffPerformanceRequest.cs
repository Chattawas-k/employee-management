using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Reports.StaffPerformance
{
    public sealed record StaffPerformanceRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<StaffPerformanceResponse>;
}
