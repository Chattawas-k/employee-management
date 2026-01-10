using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Settings.GetQueueRules
{
    public sealed record GetQueueRulesRequest() : IRequest<GetQueueRulesResponse>;
}
