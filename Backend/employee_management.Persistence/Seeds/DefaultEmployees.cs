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
            // Seed employees used by seeded login accounts.
            // Add only missing records (do not overwrite existing employees).
            var salePositionId = await context.Positions
                .Where(p => p.Name == "Sale")
                .Select(p => p.Id)
                .FirstOrDefaultAsync();

            if (salePositionId == Guid.Empty)
                return;

            var executivePositionId = await context.Positions
                .Where(p => p.Name == "ผู้บริหาร")
                .Select(p => p.Id)
                .FirstOrDefaultAsync();

            if (executivePositionId == Guid.Empty)
            {
                executivePositionId = salePositionId;
            }

            var employees = new List<Employee>
            {
                // Separate employees for admin/superadmin accounts (avoid duplicates with sales staff)
                new Employee
                {
                    Id = new Guid("88888888-8888-8888-8888-888888888888"),
                    Name = "ผู้ดูแลระบบ",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = executivePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("99999999-9999-9999-9999-999999999999"),
                    Name = "ผู้ดูแลระบบสูงสุด",
                    Phone = null,
                    Status = EmployeeStatus.Active,
                    PositionId = executivePositionId,
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new Employee
                {
                    Id = new Guid("11111111-1111-1111-1111-111111111111"),
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
                    Id = new Guid("22222222-2222-2222-2222-222222222222"),
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

            var existingIds = await context.Employees
                .AsNoTracking()
                .Where(e => employees.Select(x => x.Id).Contains(e.Id))
                .Select(e => e.Id)
                .ToListAsync();

            var toAdd = employees.Where(e => !existingIds.Contains(e.Id)).ToList();
            if (toAdd.Count == 0)
                return;

            await context.Employees.AddRangeAsync(toAdd);
            await context.SaveChangesAsync();
        }
    }
}

