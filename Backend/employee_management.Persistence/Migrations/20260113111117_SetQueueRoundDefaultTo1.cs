using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace employee_management.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SetQueueRoundDefaultTo1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Round",
                table: "Queues",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            // One-time data fix: ensure Round is never 0
            migrationBuilder.Sql("UPDATE \"Queues\" SET \"Round\" = 1 WHERE \"Round\" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Round",
                table: "Queues",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);
        }
    }
}
