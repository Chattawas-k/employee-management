using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultProductCategories
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.ProductCategories.AnyAsync())
                return;

            var categories = new List<ProductCategory>
            {
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "อุปกรณ์อิเล็กทรอนิกส์",
                    Description = "หมวดหมู่สำหรับอุปกรณ์อิเล็กทรอนิกส์ต่างๆ",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "เสื้อผ้า",
                    Description = "หมวดหมู่สำหรับเสื้อผ้าและเครื่องแต่งกาย",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "อาหาร",
                    Description = "หมวดหมู่สำหรับอาหารและเครื่องดื่ม",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "เครื่องใช้ในบ้าน",
                    Description = "หมวดหมู่สำหรับเครื่องใช้ในบ้าน",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "ของเล่น",
                    Description = "หมวดหมู่สำหรับของเล่น",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "หนังสือ",
                    Description = "หมวดหมู่สำหรับหนังสือและสื่อสิ่งพิมพ์",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                }
            };

            await context.ProductCategories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }
    }
}
