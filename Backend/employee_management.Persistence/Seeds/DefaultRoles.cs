using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultRoles
    {
        public static async Task SeedAsync(UserManager<User> userManager, RoleManager<Role> roleManager)
        {
            //Seed Roles
            await roleManager.CreateAsync(new Role("SuperAdmin"));
            await roleManager.CreateAsync(new Role("Admin"));
            await roleManager.CreateAsync(new Role("Basic"));
        }
    }
}
