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
        public DbSet<WaitingJob> WaitingJobs { get; set; }
        public DbSet<EmployeeStatusHistory> EmployeeStatusHistories { get; set; }

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
                entity.HasIndex(e => e.JobNumber);
            });

            // Configure WaitingJob entity
            modelBuilder.Entity<WaitingJob>(entity =>
            {
                entity.ToTable("WaitingJobs");

                // Configure relationship with Job
                entity.HasOne(w => w.Job)
                    .WithMany()
                    .HasForeignKey(w => w.JobId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Create indexes
                entity.HasIndex(w => w.JobId);
                entity.HasIndex(w => w.CreatedDate);
                entity.HasIndex(w => w.IsDeleted);
            });

            // Configure EmployeeStatusHistory entity
            modelBuilder.Entity<EmployeeStatusHistory>(entity =>
            {
                entity.ToTable("EmployeeStatusHistories");

                // Configure relationship with Employee
                entity.HasOne(e => e.Employee)
                    .WithMany()
                    .HasForeignKey(e => e.EmployeeId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with ChangedByEmployee
                entity.HasOne(e => e.ChangedByEmployee)
                    .WithMany()
                    .HasForeignKey(e => e.ChangedBy)
                    .OnDelete(DeleteBehavior.SetNull);

                // Create indexes
                entity.HasIndex(e => e.EmployeeId);
                entity.HasIndex(e => e.ChangedDate);
                entity.HasIndex(e => e.ChangeReason);
                entity.HasIndex(e => e.IsDeleted);
            });
        }
    }
}
