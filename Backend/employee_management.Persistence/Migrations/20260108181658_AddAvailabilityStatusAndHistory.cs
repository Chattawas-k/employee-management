using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace employee_management.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAvailabilityStatusAndHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvailabilityStatus",
                table: "Queues",
                type: "integer",
                nullable: false,
                defaultValue: 1); // Default to Available (1)

            // Migrate existing data: Inactive → Unavailable (4), Active → Available (1), Busy → Busy (2)
            migrationBuilder.Sql(@"
                UPDATE ""Queues""
                SET ""AvailabilityStatus"" = CASE 
                    WHEN ""Status"" = 1 THEN 1  -- Active → Available
                    WHEN ""Status"" = 2 THEN 4  -- Inactive → Unavailable (default, admin can change later)
                    WHEN ""Status"" = 3 THEN 2  -- Busy → Busy
                    ELSE 1
                END
                WHERE ""IsDeleted"" = false;
            ");

            migrationBuilder.CreateTable(
                name: "EmployeeStatusHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousStatus = table.Column<int>(type: "integer", nullable: true),
                    NewStatus = table.Column<int>(type: "integer", nullable: false),
                    ChangeReason = table.Column<int>(type: "integer", nullable: false),
                    ChangedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ChangedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeStatusHistories_Employees_ChangedBy",
                        column: x => x.ChangedBy,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_EmployeeStatusHistories_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WaitingJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JobId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerName = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaitingJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WaitingJobs_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeStatusHistories_ChangedBy",
                table: "EmployeeStatusHistories",
                column: "ChangedBy");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeStatusHistories_ChangedDate",
                table: "EmployeeStatusHistories",
                column: "ChangedDate");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeStatusHistories_ChangeReason",
                table: "EmployeeStatusHistories",
                column: "ChangeReason");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeStatusHistories_EmployeeId",
                table: "EmployeeStatusHistories",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeStatusHistories_IsDeleted",
                table: "EmployeeStatusHistories",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_WaitingJobs_CreatedDate",
                table: "WaitingJobs",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_WaitingJobs_IsDeleted",
                table: "WaitingJobs",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_WaitingJobs_JobId",
                table: "WaitingJobs",
                column: "JobId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeeStatusHistories");

            migrationBuilder.DropTable(
                name: "WaitingJobs");

            migrationBuilder.DropColumn(
                name: "AvailabilityStatus",
                table: "Queues");
        }
    }
}
