using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using employee_management.Persistence.Context;

#nullable disable

namespace employee_management.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260112120000_AddJobStatusHistory")]
    public partial class AddJobStatusHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobStatusHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JobId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousStatus = table.Column<int>(type: "integer", nullable: true),
                    NewStatus = table.Column<int>(type: "integer", nullable: false),
                    ChangeSource = table.Column<int>(type: "integer", nullable: false),
                    ChangedByEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChangedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    PreviousAssigneeId = table.Column<Guid>(type: "uuid", nullable: true),
                    NewAssigneeId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobStatusHistories_Employees_ChangedByEmployeeId",
                        column: x => x.ChangedByEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_JobStatusHistories_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusHistories_ChangeSource",
                table: "JobStatusHistories",
                column: "ChangeSource");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusHistories_ChangedByEmployeeId",
                table: "JobStatusHistories",
                column: "ChangedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusHistories_ChangedDate",
                table: "JobStatusHistories",
                column: "ChangedDate");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusHistories_IsDeleted",
                table: "JobStatusHistories",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusHistories_JobId",
                table: "JobStatusHistories",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusHistories_NewAssigneeId",
                table: "JobStatusHistories",
                column: "NewAssigneeId");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusHistories_PreviousAssigneeId",
                table: "JobStatusHistories",
                column: "PreviousAssigneeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobStatusHistories");
        }
    }
}

