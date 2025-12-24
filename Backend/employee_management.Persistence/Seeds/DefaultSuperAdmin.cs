using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
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
                PhoneNumberConfirmed = true
            };
            if (userManager.Users.All(u => u.Id != defaultUser.Id))
            {
                var user = await userManager.FindByEmailAsync(defaultUser.Email);
                if (user == null)
                {
                    await userManager.CreateAsync(defaultUser, "123Pa$$word!");
                    await userManager.AddToRoleAsync(defaultUser, "Basic");
                    await userManager.AddToRoleAsync(defaultUser, "Admin");
                    await userManager.AddToRoleAsync(defaultUser, "SuperAdmin");
                }

            }
        }
    }
}
