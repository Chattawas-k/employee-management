using employee_management.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultSalesStaffUsers
    {
        public static async Task SeedAsync(UserManager<User> userManager, RoleManager<Role> roleManager)
        {
            // Keep existing users (superadmin/admin/basicuser). Only add 7 staff users.
            // Password must match Identity policy (6+ chars, at least 1 lower + 1 upper).
            const string defaultPassword = "123Pa$$word!";

            var usersToSeed = new[]
            {
                new
                {
                    UserName = "sale01",
                    Email = "sale01@gmail.com",
                    FirstName = "เอื้อมพร",
                    LastName = "ปัดถา",
                    EmployeeId = new Guid("11111111-1111-1111-1111-111111111111")
                },
                new
                {
                    UserName = "sale02",
                    Email = "sale02@gmail.com",
                    FirstName = "ภาสนา",
                    LastName = "กันเติม",
                    EmployeeId = new Guid("22222222-2222-2222-2222-222222222222")
                },
                new
                {
                    UserName = "sale03",
                    Email = "sale03@gmail.com",
                    FirstName = "จนิสตา",
                    LastName = "แสวงจิตร",
                    EmployeeId = new Guid("33333333-3333-3333-3333-333333333333")
                },
                new
                {
                    UserName = "sale04",
                    Email = "sale04@gmail.com",
                    FirstName = "เสงี่ยม",
                    LastName = "แก้ววิชัย",
                    EmployeeId = new Guid("44444444-4444-4444-4444-444444444444")
                },
                new
                {
                    UserName = "sale05",
                    Email = "sale05@gmail.com",
                    FirstName = "ลักษมี",
                    LastName = "จารุภาค",
                    EmployeeId = new Guid("55555555-5555-5555-5555-555555555555")
                },
                new
                {
                    UserName = "sale06",
                    Email = "sale06@gmail.com",
                    FirstName = "เพ็ญพิสุข",
                    LastName = "เขตตะ",
                    EmployeeId = new Guid("66666666-6666-6666-6666-666666666666")
                },
                new
                {
                    UserName = "sale07",
                    Email = "sale07@gmail.com",
                    FirstName = "ชฎาพร",
                    LastName = "ก่อแก้ว",
                    EmployeeId = new Guid("77777777-7777-7777-7777-777777777777")
                }
            };

            foreach (var u in usersToSeed)
            {
                var existing = await userManager.FindByEmailAsync(u.Email);
                if (existing != null)
                    continue;

                var user = new User
                {
                    UserName = u.UserName,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true,
                    EmployeeId = u.EmployeeId
                };

                var createResult = await userManager.CreateAsync(user, defaultPassword);
                if (!createResult.Succeeded)
                    continue;

                await userManager.AddToRoleAsync(user, "Basic");
            }
        }
    }
}

