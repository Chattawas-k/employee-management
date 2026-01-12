using MediatR;

namespace employee_management.Application.Features.Monitor.Queries.GetMonitorSnapshot
{
    public sealed record GetMonitorSnapshotRequest(DateTime Date) : IRequest<GetMonitorSnapshotResponse>;
}

