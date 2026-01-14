using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultEmployees
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.Employees.AnyAsync())
                return;

            // Seed only requested employees under Position "Sale"
            var salePositionId = await context.Positions
                .Where(p => p.Name == "Sale")
                .Select(p => p.Id)
                .FirstOrDefaultAsync();

            if (salePositionId == Guid.Empty)
                return;

            var employees = new List<Employee>
            {
                new Employee
                {
                    Id = new Guid("11111111-1111-1111-1111-111111111111"), // Keep fixed ID (used by DefaultAdmin)
                    Name = "นางเอื้อมพร ปัดถา",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = salePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("22222222-2222-2222-2222-222222222222"), // Keep fixed ID (used by DefaultSuperAdmin)
                    Name = "นางสาวภาสนา กันเติม",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = salePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("33333333-3333-3333-3333-333333333333"),
                    Name = "นางจนิสตา แสวงจิตร",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = salePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("44444444-4444-4444-4444-444444444444"),
                    Name = "นางเสงี่ยม แก้ววิชัย",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = salePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("55555555-5555-5555-5555-555555555555"),
                    Name = "นางสาวลักษมี จารุภาค",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = salePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("66666666-6666-6666-6666-666666666666"),
                    Name = "นางสาวเพ็ญพิสุข เขตตะ",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = salePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("77777777-7777-7777-7777-777777777777"),
                    Name = "นางสาวชฎาพร ก่อแก้ว",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = salePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                }
            };

            await context.Employees.AddRangeAsync(employees);
            await context.SaveChangesAsync();
        }
    }
}

