using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.TestTakersRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Repository;
using employee_management.Persistence.Repository.TestTakersRepository;
using employee_management.Persistence.Services;

namespace employee_management.Persistence
{
    public static class ServiceExtensions
    {
        public static void ConfigurePersistence(this IServiceCollection services, IConfiguration configuration)
        {
            var connection = configuration.GetConnectionString("ApplicationDbContext");
            services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connection));

            // Configure ASP.NET Core Identity
            services.AddIdentity<User, Role>(options =>
                {
                    // Password settings
                    options.Password.RequireDigit = true;
                    options.Password.RequireLowercase = true;
                    options.Password.RequireUppercase = true;
                    options.Password.RequireNonAlphanumeric = false;
                    options.Password.RequiredLength = 6;

                    // Lockout settings
                    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                    options.Lockout.MaxFailedAccessAttempts = 5;
                    options.Lockout.AllowedForNewUsers = true;

                    // User settings
                    options.User.RequireUniqueEmail = true;
                })
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            // Add IHttpClientFactory
            services.AddHttpClient();

            //Repositories
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<ITestTakerRepository, TestTakerRepository>();
            services.AddScoped<employee_management.Application.Repository.EmployeesRepository.IEmployeeRepository, employee_management.Persistence.Repository.EmployeesRepository.EmployeeRepository>();
            services.AddScoped<employee_management.Application.Repository.PositionsRepository.IPositionRepository, employee_management.Persistence.Repository.PositionsRepository.PositionRepository>();
            services.AddScoped<employee_management.Application.Repository.DepartmentsRepository.IDepartmentRepository, employee_management.Persistence.Repository.DepartmentsRepository.DepartmentRepository>();
            services.AddScoped<employee_management.Application.Repository.QueuesRepository.IQueueRepository, employee_management.Persistence.Repository.QueuesRepository.QueueRepository>();
            services.AddScoped<employee_management.Application.Repository.JobsRepository.IJobRepository, employee_management.Persistence.Repository.JobsRepository.JobRepository>();
            //Services
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ICurrentUserService, CurrentUserService>();

            // Register authentication/login related services
            services.AddScoped<ILoginService, LoginService>();
        }
    }
}
