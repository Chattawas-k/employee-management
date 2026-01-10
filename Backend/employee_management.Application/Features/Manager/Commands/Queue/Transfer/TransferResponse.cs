namespace employee_management.Application.Features.Manager.Commands.Queue.Transfer
{
    public sealed record TransferResponse(
        Guid JobId,
        Guid FromStaffId,
        Guid ToStaffId,
        string ToStaffName
    );
}
