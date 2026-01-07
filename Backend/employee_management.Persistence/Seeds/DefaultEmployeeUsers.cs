using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class DefaultEmployeeUsers
    {
        public static async Task SeedAsync(UserManager<User> userManager, RoleManager<Role> roleManager, ApplicationDbContext context)
        {
            // Employee data mapping - try to find by name first, then by fixed GUID
            var employeeUserData = new Dictionary<string, (Guid FixedId, string UserName, string Email, string FirstName, string LastName)>
            {
                { "สมชาย ใจดี", (new Guid("33333333-3333-3333-3333-333333333333"), "somchai", "somchai@employee.com", "Somchai", "Jaidee") },
                { "วิชัย สมบูรณ์", (new Guid("44444444-4444-4444-4444-444444444444"), "wichai", "wichai@employee.com", "Wichai", "Somboon") },
                { "สมศรี ทำงานดี", (new Guid("55555555-5555-5555-5555-555555555555"), "somsri", "somsri@employee.com", "Somsri", "Tamngandee") },
                { "สุรีย์ ตรวจสอบดี", (new Guid("66666666-6666-6666-6666-666666666666"), "suree", "suree@employee.com", "Suree", "Truatsopdee") },
                { "สุดา ขายดี", (new Guid("77777777-7777-7777-7777-777777777777"), "suda", "suda@employee.com", "Suda", "Khaidee") }
            };

            // Get employees by name (more reliable than by GUID if GUID hasn't been updated yet)
            var employees = await context.Employees
                .Where(e => employeeUserData.Keys.Contains(e.Name) && !e.IsDeleted)
                .ToListAsync();

            const string defaultPassword = "123Pa$$word!";

            foreach (var employee in employees)
            {
                if (employeeUserData.TryGetValue(employee.Name, out var userData))
                {
                    // Check if user already exists
                    var existingUser = await userManager.FindByEmailAsync(userData.Email);
                    if (existingUser != null)
                    {
                        continue; // Skip if user already exists
                    }

                    // Check if employee already has a user account
                    var existingUserByEmployeeId = userManager.Users
                        .FirstOrDefault(u => u.EmployeeId == employee.Id);
                    if (existingUserByEmployeeId != null)
                    {
                        continue; // Skip if employee already has a user account
                    }

                    // Create new user
                    var user = new User
                    {
                        UserName = userData.UserName,
                        Email = userData.Email,
                        FirstName = userData.FirstName,
                        LastName = userData.LastName,
                        EmailConfirmed = true,
                        PhoneNumberConfirmed = true,
                        EmployeeId = employee.Id
                    };

                    var result = await userManager.CreateAsync(user, defaultPassword);
                    if (result.Succeeded)
                    {
                        // Assign Basic role
                        await userManager.AddToRoleAsync(user, "Basic");
                    }
                    else
                    {
                        // Log errors if user creation fails
                        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                        throw new InvalidOperationException($"Failed to create user {userData.Email}: {errors}");
                    }
                }
            }
        }
    }
}

