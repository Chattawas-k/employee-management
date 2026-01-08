using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class QueueHistorySeed
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Check if queues for these dates already exist
            // Use UTC DateTime for PostgreSQL compatibility
            var startDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(2026, 1, 7, 23, 59, 59, DateTimeKind.Utc);
            
            var existingQueues = await context.Queues
                .Where(q => q.QueueDate >= startDate && q.QueueDate <= endDate && !q.IsDeleted)
                .AnyAsync();
            
            if (existingQueues)
            {
                return; // Data already seeded
            }

            // Get all active employees
            var employees = await context.Employees
                .Where(e => e.Status == EmployeeStatus.Active && !e.IsDeleted)
                .ToListAsync();

            if (!employees.Any())
            {
                return; // No employees to create queues for
            }

            var queues = new List<Queue>();
            var random = new Random(12345); // Fixed seed for consistent data

            // Create queues for each day from Jan 1-7, 2026
            for (int day = 1; day <= 7; day++)
            {
                // Use UTC DateTime for PostgreSQL compatibility
                var queueDate = new DateTime(2026, 1, day, 0, 0, 0, DateTimeKind.Utc);
                
                // Shuffle employees for each day to create different queue orders
                var shuffledEmployees = employees.OrderBy(e => random.Next()).ToList();
                
                int position = 1;
                foreach (var employee in shuffledEmployees)
                {
                    // Vary the status for some employees
                    var status = position == 1 ? QueueStatus.Active : 
                                position <= 3 ? QueueStatus.Active : 
                                position <= 5 ? QueueStatus.Busy : 
                                QueueStatus.Inactive;

                    queues.Add(new Queue
                    {
                        Id = Guid.NewGuid(),
                        EmployeeId = employee.Id,
                        Position = position++,
                        Status = status,
                        QueueDate = queueDate,
                        CreatedDate = DateTimeOffset.UtcNow,
                        UpdatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    });
                }
            }

            if (queues.Any())
            {
                await context.Queues.AddRangeAsync(queues);
                await context.SaveChangesAsync();
            }
        }
    }
}

