using employee_management.Application.Common.Services;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Services
{
    public sealed class RefreshTokenRevoker : IRefreshTokenRevoker
    {
        private readonly ApplicationDbContext _dbContext;

        public RefreshTokenRevoker(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task RevokeByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default)
        {
            if (employeeId == Guid.Empty)
                return;

            var userIds = await _dbContext.Users
                .AsNoTracking()
                .Where(u => u.EmployeeId == employeeId)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            if (userIds.Count == 0)
                return;

            var tokens = await _dbContext.RefreshTokens
                .Where(rt => userIds.Contains(rt.UserId) && rt.Revoked == null && rt.Expires > DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            if (tokens.Count == 0)
                return;

            var now = DateTime.UtcNow;
            foreach (var token in tokens)
            {
                token.Revoked = now;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

