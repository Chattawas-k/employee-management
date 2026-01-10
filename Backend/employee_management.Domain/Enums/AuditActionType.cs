namespace employee_management.Domain.Enums
{
    public enum AuditActionType
    {
        Assign = 1,
        Transfer = 2,
        StatusChange = 3,
        CloseWon = 4,
        CloseLost = 5,
        RuleChange = 6,
        ForceAssign = 7,
        Escalate = 8,
        Cancel = 9
    }
}
