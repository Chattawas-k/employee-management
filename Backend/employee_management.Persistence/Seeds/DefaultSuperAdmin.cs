using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultSuperAdmin
    {
        public static async Task SeedAsync(UserManager<User> userManager, RoleManager<Role> roleManager)
        {
            //Seed Default User
            var defaultUser = new User
            {
                UserName = "superadmin",
                Email = "superadmin@gmail.com",
                FirstName = "Super",
                LastName = "Admin",
                EmailConfirmed = true,
                PhoneNumberConfirmed = true,
                // Use separate employee to avoid duplicate rows with sales staff
                EmployeeId = new Guid("99999999-9999-9999-9999-999999999999")
            };
            var user = await userManager.FindByEmailAsync(defaultUser.Email);
            if (user == null)
            {
                await userManager.CreateAsync(defaultUser, "123Pa$$word!");
                await userManager.AddToRoleAsync(defaultUser, "Basic");
                await userManager.AddToRoleAsync(defaultUser, "Admin");
                await userManager.AddToRoleAsync(defaultUser, "SuperAdmin");
            }
            else
            {
                var needsUpdate = false;
                if (user.EmployeeId != defaultUser.EmployeeId)
                {
                    user.EmployeeId = defaultUser.EmployeeId;
                    needsUpdate = true;
                }
                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    needsUpdate = true;
                }
                if (!user.PhoneNumberConfirmed)
                {
                    user.PhoneNumberConfirmed = true;
                    needsUpdate = true;
                }

                if (needsUpdate)
                {
                    await userManager.UpdateAsync(user);
                }

                if (!await userManager.IsInRoleAsync(user, "Basic"))
                {
                    await userManager.AddToRoleAsync(user, "Basic");
                }
                if (!await userManager.IsInRoleAsync(user, "Admin"))
                {
                    await userManager.AddToRoleAsync(user, "Admin");
                }
                if (!await userManager.IsInRoleAsync(user, "SuperAdmin"))
                {
                    await userManager.AddToRoleAsync(user, "SuperAdmin");
                }
            }
        }
    }
}
