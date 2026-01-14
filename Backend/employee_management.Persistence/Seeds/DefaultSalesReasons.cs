using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultSalesReasons
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.SalesReasons.AnyAsync())
                return;

            var labels = new[]
            {
                "ราคา",
                "รูปแบบ",
                "งบประมาณ",
                "ไม่มีสินค้า"
            };

            var reasons = new List<SalesReason>();

            // Seed both types with consistent sort order
            foreach (var type in new[] { SalesReasonType.PendingDecision, SalesReasonType.FailedClose })
            {
                for (var i = 0; i < labels.Length; i++)
                {
                    reasons.Add(new SalesReason
                    {
                        Id = Guid.NewGuid(),
                        Type = type,
                        Label = labels[i],
                        SortOrder = i + 1,
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    });
                }
            }

            await context.SalesReasons.AddRangeAsync(reasons);
            await context.SaveChangesAsync();
        }
    }
}

