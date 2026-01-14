using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace employee_management.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesReasonsMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SalesReasons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesReasons", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SalesReasons_IsActive",
                table: "SalesReasons",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SalesReasons_IsDeleted",
                table: "SalesReasons",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_SalesReasons_Type",
                table: "SalesReasons",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_SalesReasons_Type_Label_IsDeleted",
                table: "SalesReasons",
                columns: new[] { "Type", "Label", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SalesReasons_Type_SortOrder",
                table: "SalesReasons",
                columns: new[] { "Type", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SalesReasons");
        }
    }
}
