using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
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
        public DbSet<JobStatusHistory> JobStatusHistories { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<QueueRule> QueueRules { get; set; }
        public DbSet<ProductCategory> ProductCategories { get; set; }

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

                // Configure relationship with ProductCategory
                entity.HasOne(e => e.ProductCategory)
                    .WithMany()
                    .HasForeignKey(e => e.ProductCategoryId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Create indexes
                entity.HasIndex(e => e.AssigneeId);
                entity.HasIndex(e => e.ProductCategoryId);
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
                entity.HasIndex(e => new { e.EmployeeId, e.ChangedDate });
                entity.HasIndex(e => e.ChangeReason);
                entity.HasIndex(e => e.IsDeleted);

                entity.Property(e => e.ActorType)
                    .HasDefaultValue(StatusActorType.Unknown);

                entity.Property(e => e.Source)
                    .HasDefaultValue(StatusChangeSource.Unknown);
            });

            modelBuilder.Entity<Queue>(entity =>
            {
                entity.ToTable("Queues");
                entity.Property(e => e.Round).HasDefaultValue(1);
            });

            // Configure JobStatusHistory entity
            modelBuilder.Entity<JobStatusHistory>(entity =>
            {
                entity.ToTable("JobStatusHistories");

                entity.HasOne(e => e.Job)
                    .WithMany()
                    .HasForeignKey(e => e.JobId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ChangedByEmployee)
                    .WithMany()
                    .HasForeignKey(e => e.ChangedByEmployeeId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.JobId);
                entity.HasIndex(e => e.ChangedDate);
                entity.HasIndex(e => e.ChangeSource);
                entity.HasIndex(e => e.ChangedByEmployeeId);
                entity.HasIndex(e => e.IsDeleted);

                entity.HasIndex(e => e.PreviousAssigneeId);
                entity.HasIndex(e => e.NewAssigneeId);
            });

            // Configure AuditLog entity
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("AuditLogs");

                // Create indexes
                entity.HasIndex(e => e.ActorId);
                entity.HasIndex(e => e.ActionType);
                entity.HasIndex(e => e.EntityType);
                entity.HasIndex(e => e.EntityId);
                entity.HasIndex(e => e.Timestamp);
            });

            // Configure QueueRule entity
            modelBuilder.Entity<QueueRule>(entity =>
            {
                entity.ToTable("QueueRules");

                // Only one active rule at a time
                entity.HasIndex(e => e.IsActive);
            });

            // Configure ProductCategory entity
            modelBuilder.Entity<ProductCategory>(entity =>
            {
                entity.ToTable("ProductCategories");

                // Create indexes
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsDeleted);
            });
        }
    }
}
