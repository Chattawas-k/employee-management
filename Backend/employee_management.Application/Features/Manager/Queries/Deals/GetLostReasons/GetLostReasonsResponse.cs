namespace employee_management.Application.Features.Manager.Queries.Deals.GetLostReasons
{
    public sealed record GetLostReasonsResponse(
        List<LostReasonSummary> Reasons
    );

    public sealed record LostReasonSummary(
        string Reason,
        int Count,
        double Percentage
    );
}
