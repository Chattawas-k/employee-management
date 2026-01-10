using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Dashboard.GetStaffSnapshot
{
    public sealed record GetStaffSnapshotRequest() : IRequest<GetStaffSnapshotResponse>;
}
