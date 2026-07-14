using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace employee_management.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJobReportHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobReportHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JobId = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotJson = table.Column<string>(type: "jsonb", nullable: false),
                    ChangedFieldsJson = table.Column<string>(type: "jsonb", nullable: false),
                    EditedByEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    EditedByName = table.Column<string>(type: "text", nullable: true),
                    EditedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EditNote = table.Column<string>(type: "text", nullable: true),
                    IsOriginal = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobReportHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobReportHistories_Employees_EditedByEmployeeId",
                        column: x => x.EditedByEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_JobReportHistories_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobReportHistories_EditedByEmployeeId",
                table: "JobReportHistories",
                column: "EditedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_JobReportHistories_EditedDate",
                table: "JobReportHistories",
                column: "EditedDate");

            migrationBuilder.CreateIndex(
                name: "IX_JobReportHistories_IsDeleted",
                table: "JobReportHistories",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_JobReportHistories_JobId",
                table: "JobReportHistories",
                column: "JobId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobReportHistories");
        }
    }
}
