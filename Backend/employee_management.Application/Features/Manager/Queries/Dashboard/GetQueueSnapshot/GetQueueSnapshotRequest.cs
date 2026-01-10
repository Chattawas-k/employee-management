using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetQueueSnapshot
{
    public sealed record GetQueueSnapshotRequest(
        int TopCount = 10
    ) : IRequest<GetQueueSnapshotResponse>;
}
