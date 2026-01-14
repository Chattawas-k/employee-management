namespace employee_management.Application.Common.Services
{
    /// <summary>
    /// Abstraction to revoke refresh tokens for users linked to an employee.
    /// </summary>
    public interface IRefreshTokenRevoker
    {
        Task RevokeByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default);
    }
}

