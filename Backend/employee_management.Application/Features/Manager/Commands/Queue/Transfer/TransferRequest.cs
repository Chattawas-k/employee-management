using MediatR;

namespace employee_management.Application.Features.Manager.Commands.Queue.Transfer
{
    public sealed record TransferRequest(
        Guid JobId,
        Guid ToStaffId,
        string Reason
    ) : IRequest<TransferResponse>;
}
