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
                    Name = "ห้องนอน",
                    Description = "หมวดหมู่สำหรับห้องนอน",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "ห้องรับแขก",
                    Description = "หมวดหมู่สำหรับห้องรับแขก",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "ห้องอาหาร",
                    Description = "หมวดหมู่สำหรับห้องอาหาร",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "ห้องสำนักงาน",
                    Description = "หมวดหมู่สำหรับห้องสำนักงาน",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "ห้องครัว",
                    Description = "หมวดหมู่สำหรับห้องครัว",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "สนามเด็กเล่น",
                    Description = "หมวดหมู่สำหรับสนามเด็กเล่น",
                    IsActive = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    IsDeleted = false
                },
                new ProductCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "อื่นๆ",
                    Description = "หมวดหมู่สำหรับอื่นๆ",
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
