using employee_management.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace employee_management.Persistence.Seeds
{
    public static class UpdateEmployeeGuids
    {
        public static async Task UpdateAsync(ApplicationDbContext context)
        {
            // Mapping of employee names to fixed GUIDs
            var employeeGuidMap = new Dictionary<string, Guid>
            {
                { "สมชาย ใจดี", new Guid("33333333-3333-3333-3333-333333333333") },
                { "วิชัย สมบูรณ์", new Guid("44444444-4444-4444-4444-444444444444") },
                { "สมศรี ทำงานดี", new Guid("55555555-5555-5555-5555-555555555555") },
                { "สุรีย์ ตรวจสอบดี", new Guid("66666666-6666-6666-6666-666666666666") },
                { "สุดา ขายดี", new Guid("77777777-7777-7777-7777-777777777777") }
            };

            foreach (var kvp in employeeGuidMap)
            {
                var employee = await context.Employees
                    .FirstOrDefaultAsync(e => e.Name == kvp.Key && !e.IsDeleted);

                if (employee != null && employee.Id != kvp.Value)
                {
                    // Check if the target GUID is already in use
                    var existingEmployeeWithTargetId = await context.Employees
                        .FirstOrDefaultAsync(e => e.Id == kvp.Value && !e.IsDeleted);

                    if (existingEmployeeWithTargetId == null)
                    {
                        // Use a transaction to ensure all updates succeed or fail together
                        using var transaction = await context.Database.BeginTransactionAsync();
                        try
                        {
                            var oldId = employee.Id;
                            var newId = kvp.Value;

                            // Update related User records first
                            await context.Database.ExecuteSqlInterpolatedAsync(
                                $@"UPDATE ""AspNetUsers"" SET ""EmployeeId"" = {newId} WHERE ""EmployeeId"" = {oldId}");

                            // Update related Job records
                            await context.Database.ExecuteSqlInterpolatedAsync(
                                $@"UPDATE ""Jobs"" SET ""AssigneeId"" = {newId} WHERE ""AssigneeId"" = {oldId}");

                            // Finally update the Employee record
                            await context.Database.ExecuteSqlInterpolatedAsync(
                                $@"UPDATE ""Employees"" SET ""Id"" = {newId} WHERE ""Id"" = {oldId}");

                            await transaction.CommitAsync();
                        }
                        catch
                        {
                            await transaction.RollbackAsync();
                            throw;
                        }
                    }
                }
            }
        }
    }
}

