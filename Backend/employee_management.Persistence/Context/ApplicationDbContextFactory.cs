using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace employee_management.Persistence.Context
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            // Get the directory where this assembly is located (Persistence project)
            var persistenceDir = Path.GetDirectoryName(typeof(ApplicationDbContextFactory).Assembly.Location) ?? "";
            
            // Navigate to WebAPI project (sibling directory)
            var basePath = Path.GetFullPath(Path.Combine(persistenceDir, "..", "employee_management.WebAPI"));
            
            // If not found, try from current working directory
            if (!Directory.Exists(basePath) || !File.Exists(Path.Combine(basePath, "appsettings.json")))
            {
                basePath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "employee_management.WebAPI"));
            }
            
            // Last resort: try from solution root
            if (!Directory.Exists(basePath) || !File.Exists(Path.Combine(basePath, "appsettings.json")))
            {
                var solutionDir = Path.GetFullPath(Path.Combine(persistenceDir, "..", ".."));
                basePath = Path.Combine(solutionDir, "Backend", "employee_management.WebAPI");
            }

            if (!Directory.Exists(basePath))
            {
                throw new DirectoryNotFoundException($"Could not find WebAPI project directory. Tried: {basePath}");
            }

            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true)
                .Build();

            var builder = new DbContextOptionsBuilder<ApplicationDbContext>();
            var connectionString = configuration.GetConnectionString("ApplicationDbContext");
            
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException($"Connection string 'ApplicationDbContext' not found in appsettings.json at: {basePath}");
            }
            
            builder.UseNpgsql(connectionString);

            return new ApplicationDbContext(builder.Options);
        }
    }
}