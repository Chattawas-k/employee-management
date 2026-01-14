using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultPositions
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.Positions.AnyAsync())
                return;

            // Only seed required positions: ผู้บริหาร, Sale (under department "ขาย")
            var salesDepartmentId = await context.Departments
                .Where(d => d.Name == "ขาย")
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            if (salesDepartmentId == Guid.Empty)
                return;

            var positions = new List<Position>
            {
                new Position
                {
                    Id = Guid.NewGuid(),
                    Name = "ผู้บริหาร",
                    Description = "ผู้บริหาร",
                    DepartmentId = salesDepartmentId,
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Position
                {
                    Id = Guid.NewGuid(),
                    Name = "Sale",
                    Description = "Sale",
                    DepartmentId = salesDepartmentId,
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                }
            };

            await context.Positions.AddRangeAsync(positions);
            await context.SaveChangesAsync();
        }
    }
}

