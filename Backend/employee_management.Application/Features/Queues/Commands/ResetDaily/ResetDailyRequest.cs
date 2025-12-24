using MediatR;

namespace employee_management.Application.Features.Queues.Commands.ResetDaily
{
    public sealed record ResetDailyRequest(DateTime Date) : IRequest<ResetDailyResponse>;
}

