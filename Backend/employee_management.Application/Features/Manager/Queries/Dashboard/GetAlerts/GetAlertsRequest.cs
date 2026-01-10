using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetAlerts
{
    public sealed record GetAlertsRequest() : IRequest<GetAlertsResponse>;
}
