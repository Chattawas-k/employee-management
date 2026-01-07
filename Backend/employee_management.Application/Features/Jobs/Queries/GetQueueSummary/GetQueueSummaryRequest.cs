using MediatR;
using System;

namespace employee_management.Application.Features.Jobs.Queries.GetQueueSummary
{
    public sealed record GetQueueSummaryRequest(DateTime Date) : IRequest<GetQueueSummaryResponse>;
}

