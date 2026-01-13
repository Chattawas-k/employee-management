using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace employee_management.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeStatusHistoryActorAndSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActorType",
                table: "EmployeeStatusHistories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Source",
                table: "EmployeeStatusHistories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeStatusHistories_EmployeeId_ChangedDate",
                table: "EmployeeStatusHistories",
                columns: new[] { "EmployeeId", "ChangedDate" });

            // Backfill ActorType from existing data:
            // - Auto => System
            // - Manual + ChangedBy == EmployeeId => Self
            // - Manual + ChangedBy != EmployeeId => Admin
            migrationBuilder.Sql(@"
UPDATE ""EmployeeStatusHistories""
SET ""ActorType"" =
    CASE
        WHEN ""ChangeReason"" = 1 THEN 3
        WHEN ""ChangeReason"" = 2 AND ""ChangedBy"" IS NOT NULL AND ""ChangedBy"" = ""EmployeeId"" THEN 1
        WHEN ""ChangeReason"" = 2 AND ""ChangedBy"" IS NOT NULL AND ""ChangedBy"" <> ""EmployeeId"" THEN 2
        WHEN ""ChangeReason"" = 2 THEN 1
        ELSE 0
    END
WHERE ""ActorType"" = 0;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeStatusHistories_EmployeeId_ChangedDate",
                table: "EmployeeStatusHistories");

            migrationBuilder.DropColumn(
                name: "ActorType",
                table: "EmployeeStatusHistories");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "EmployeeStatusHistories");
        }
    }
}
