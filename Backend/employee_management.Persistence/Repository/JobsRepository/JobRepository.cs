using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using employee_management.Application.Common.Services;

namespace employee_management.Persistence.Repository.JobsRepository
{
    public class JobRepository : BaseRepository<Job>, IJobRepository
    {
        public JobRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public new async Task<Job?> Get(Guid id, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted)
                .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
        }

        public async Task<List<Job>> GetMyTasksAsync(Guid employeeId, CancellationToken cancellationToken)
        {
            return await Context.Jobs
                .Include(j => j.Employee)
                .Where(j => !j.IsDeleted && j.AssigneeId == employeeId)
                .OrderByDescending(j => j.CreatedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<string> GetNextRunningNumberAsync(DateTime date, CancellationToken cancellationToken)
        {
            // Format: ddMMyyyy###
            var datePrefix = date.ToString("ddMMyyyy");
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1);

            // Get all running numbers for the current date
            var existingNumbers = await Context.Jobs
                .Where(j => !j.IsDeleted && 
                           !string.IsNullOrEmpty(j.RunningNumber) &&
                           j.RunningNumber.StartsWith(datePrefix))
                .Select(j => j.RunningNumber)
                .ToListAsync(cancellationToken);

            // Extract the numeric part and find the maximum
            int maxNumber = 0;
            foreach (var number in existingNumbers)
            {
                if (number.Length >= datePrefix.Length + 3)
                {
                    var numericPart = number.Substring(datePrefix.Length);
                    if (int.TryParse(numericPart, out int num))
                    {
                        maxNumber = Math.Max(maxNumber, num);
                    }
                }
            }

            // Increment and format with 3 digits
            var nextNumber = maxNumber + 1;
            return $"{datePrefix}{nextNumber:D3}";
        }
    }
}

