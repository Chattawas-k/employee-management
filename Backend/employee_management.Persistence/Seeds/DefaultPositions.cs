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

            // Get departments first
            var departments = await context.Departments.ToListAsync();
            var departmentDict = departments.ToDictionary(d => d.Name, d => d.Id);

            var positions = new List<Position>();

            // Positions for ซ่อมบำรุง
            if (departmentDict.ContainsKey("ซ่อมบำรุง"))
            {
                positions.AddRange(new[]
                {
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "ช่างเทคนิค",
                        Description = "ช่างเทคนิค",
                        DepartmentId = departmentDict["ซ่อมบำรุง"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    },
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "หัวหน้าช่าง",
                        Description = "หัวหน้าช่าง",
                        DepartmentId = departmentDict["ซ่อมบำรุง"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    },
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "ช่างซ่อม",
                        Description = "ช่างซ่อม",
                        DepartmentId = departmentDict["ซ่อมบำรุง"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    }
                });
            }

            // Positions for ผลิต
            if (departmentDict.ContainsKey("ผลิต"))
            {
                positions.AddRange(new[]
                {
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "พนักงานผลิต",
                        Description = "พนักงานผลิต",
                        DepartmentId = departmentDict["ผลิต"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    },
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "หัวหน้าผลิต",
                        Description = "หัวหน้าผลิต",
                        DepartmentId = departmentDict["ผลิต"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    }
                });
            }

            // Positions for ควบคุมคุณภาพ
            if (departmentDict.ContainsKey("ควบคุมคุณภาพ"))
            {
                positions.AddRange(new[]
                {
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "พนักงาน QC",
                        Description = "พนักงานควบคุมคุณภาพ",
                        DepartmentId = departmentDict["ควบคุมคุณภาพ"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    },
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "หัวหน้า QC",
                        Description = "หัวหน้าควบคุมคุณภาพ",
                        DepartmentId = departmentDict["ควบคุมคุณภาพ"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    }
                });
            }

            // Positions for จัดซื้อ
            if (departmentDict.ContainsKey("จัดซื้อ"))
            {
                positions.AddRange(new[]
                {
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "พนักงานจัดซื้อ",
                        Description = "พนักงานจัดซื้อ",
                        DepartmentId = departmentDict["จัดซื้อ"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    },
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "หัวหน้าจัดซื้อ",
                        Description = "หัวหน้าจัดซื้อ",
                        DepartmentId = departmentDict["จัดซื้อ"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    }
                });
            }

            // Positions for ขาย
            if (departmentDict.ContainsKey("ขาย"))
            {
                positions.AddRange(new[]
                {
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "พนักงานขาย",
                        Description = "พนักงานขาย",
                        DepartmentId = departmentDict["ขาย"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    },
                    new Position
                    {
                        Id = Guid.NewGuid(),
                        Name = "หัวหน้าขาย",
                        Description = "หัวหน้าขาย",
                        DepartmentId = departmentDict["ขาย"],
                        IsActive = true,
                        CreatedDate = DateTimeOffset.UtcNow,
                        IsDeleted = false
                    }
                });
            }

            if (positions.Any())
            {
                await context.Positions.AddRangeAsync(positions);
                await context.SaveChangesAsync();
            }
        }
    }
}

