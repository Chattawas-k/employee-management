namespace employee_management.Application.Features.Manager.Queries.Reports.LostReasons
{
    public sealed record LostReasonsResponse(
        List<LostReasonItem> Reasons
    );

    public sealed record LostReasonItem(
        string Reason,
        int Count,
        double Percentage,
        List<LostReasonDetail> Details
    );

    public sealed record LostReasonDetail(
        Guid JobId,
        string JobNumber,
        string Customer,
        string StaffName,
        DateTimeOffset ClosedDate
    );
}
