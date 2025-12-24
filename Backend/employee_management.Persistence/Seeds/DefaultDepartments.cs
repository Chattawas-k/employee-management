using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultDepartments
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.Departments.AnyAsync())
                return;

            var departments = new List<Department>
            {
                new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "ซ่อมบำรุง",
                    Description = "แผนกซ่อมบำรุง",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "ผลิต",
                    Description = "แผนกผลิต",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "ควบคุมคุณภาพ",
                    Description = "แผนกควบคุมคุณภาพ",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "จัดซื้อ",
                    Description = "แผนกจัดซื้อ",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "ขาย",
                    Description = "แผนกขาย",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                }
            };

            await context.Departments.AddRangeAsync(departments);
            await context.SaveChangesAsync();
        }
    }
}

