namespace employee_management.Application.Features.Manager.Commands.Queue.ForceAssign
{
    public sealed record ForceAssignResponse(
        Guid JobId,
        Guid StaffId,
        string StaffName
    );
}
