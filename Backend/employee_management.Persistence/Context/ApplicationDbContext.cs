using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using employee_management.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace employee_management.Persistence.Context
{
    public class ApplicationDbContext : IdentityDbContext<
        User, Role, Guid,
        IdentityUserClaim<Guid>, UserRole,
        IdentityUserLogin<Guid>, IdentityRoleClaim<Guid>, IdentityUserToken<Guid>>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<TestTaker> TestTakers { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Queue> Queues { get; set; }
        public DbSet<Job> Jobs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User-Employee relationship
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasOne(u => u.Employee)
                    .WithMany()
                    .HasForeignKey(u => u.EmployeeId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(u => u.EmployeeId);
            });

            // Configure Job entity
            modelBuilder.Entity<Job>(entity =>
            {
                entity.ToTable("Jobs");

                // Configure JSON columns for PostgreSQL
                entity.Property(e => e.StatusLogsJson)
                    .HasColumnName("StatusLogs")
                    .HasColumnType("jsonb");

                entity.Property(e => e.ReportJson)
                    .HasColumnName("Report")
                    .HasColumnType("jsonb");

                // Ignore helper properties that are not database columns
                entity.Ignore(e => e.StatusLogs);
                entity.Ignore(e => e.Report);

                // Configure relationship with Employee
                entity.HasOne(e => e.Employee)
                    .WithMany()
                    .HasForeignKey(e => e.AssigneeId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Create indexes
                entity.HasIndex(e => e.AssigneeId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedDate);
            });
        }
    }
}
