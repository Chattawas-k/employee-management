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

            // Get positions first
            var positions = await context.Positions
                .Include(p => p.Department)
                .ToListAsync();
            
            var positionDict = positions.ToDictionary(
                p => $"{p.Department?.Name}_{p.Name}", 
                p => p.Id
            );

            var employees = new List<Employee>();

            // Employees for ซ่อมบำรุง department
            if (positionDict.ContainsKey("ซ่อมบำรุง_ช่างเทคนิค"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "สมชาย ใจดี",
                    Phone = "081-234-5678",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ซ่อมบำรุง_ช่างเทคนิค"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            if (positionDict.ContainsKey("ซ่อมบำรุง_หัวหน้าช่าง"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "วิชัย สมบูรณ์",
                    Phone = "082-345-6789",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ซ่อมบำรุง_หัวหน้าช่าง"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            if (positionDict.ContainsKey("ซ่อมบำรุง_ช่างซ่อม"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "ประเสริฐ เก่งมาก",
                    Phone = "083-456-7890",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ซ่อมบำรุง_ช่างซ่อม"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            // Employees for ผลิต department
            if (positionDict.ContainsKey("ผลิต_พนักงานผลิต"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "สมศรี ทำงานดี",
                    Phone = "084-567-8901",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ผลิต_พนักงานผลิต"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });

                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "มาลี ขยันมาก",
                    Phone = "085-678-9012",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ผลิต_พนักงานผลิต"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            if (positionDict.ContainsKey("ผลิต_หัวหน้าผลิต"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "ประยุทธ์ เก่งกาจ",
                    Phone = "086-789-0123",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ผลิต_หัวหน้าผลิต"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            // Employees for ควบคุมคุณภาพ department
            if (positionDict.ContainsKey("ควบคุมคุณภาพ_พนักงาน QC"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "สุรีย์ ตรวจสอบดี",
                    Phone = "087-890-1234",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ควบคุมคุณภาพ_พนักงาน QC"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            if (positionDict.ContainsKey("ควบคุมคุณภาพ_หัวหน้า QC"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "วิไล ควบคุมดี",
                    Phone = "088-901-2345",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ควบคุมคุณภาพ_หัวหน้า QC"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            // Employees for จัดซื้อ department
            if (positionDict.ContainsKey("จัดซื้อ_พนักงานจัดซื้อ"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "สมปอง จัดซื้อดี",
                    Phone = "089-012-3456",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["จัดซื้อ_พนักงานจัดซื้อ"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            if (positionDict.ContainsKey("จัดซื้อ_หัวหน้าจัดซื้อ"))
            {
                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "ประพันธ์ จัดการดี",
                    Phone = "090-123-4567",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["จัดซื้อ_หัวหน้าจัดซื้อ"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            // Employees for ขาย department
            if (positionDict.ContainsKey("ขาย_พนักงานขาย"))
            {
                employees.Add(new Employee
                {
                    Id = new Guid("11111111-1111-1111-1111-111111111111"), // Fixed ID for admin user link
                    Name = "สมหมาย ขายเก่ง",
                    Phone = "091-234-5678",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ขาย_พนักงานขาย"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });

                employees.Add(new Employee
                {
                    Id = Guid.NewGuid(),
                    Name = "สุดา ขายดี",
                    Phone = "092-345-6789",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ขาย_พนักงานขาย"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            if (positionDict.ContainsKey("ขาย_หัวหน้าขาย"))
            {
                employees.Add(new Employee
                {
                    Id = new Guid("22222222-2222-2222-2222-222222222222"), // Fixed ID for superadmin user link
                    Name = "ประเสริฐ ขายเยี่ยม",
                    Phone = "093-456-7890",
                    Status = EmployeeStatus.Active,
                    PositionId = positionDict["ขาย_หัวหน้าขาย"],
                    Avatar = null,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                });
            }

            if (employees.Any())
            {
                await context.Employees.AddRangeAsync(employees);
                await context.SaveChangesAsync();
            }
        }
    }
}

