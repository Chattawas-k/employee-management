using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace employee_management.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJobRunningCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "JobRunningCode",
                table: "Jobs",
                type: "text",
                nullable: true);

            // Backfill all existing JobNumber values:
            // Old: YYMMDDNNNN (e.g. 2601010004)
            // New: YYMMDD + running(min 3 digits, extend if >= 1000) (e.g. 260101004, 2601011000)
            // Also fill JobRunningCode with only running part (e.g. 004, 1000)
            migrationBuilder.Sql(@"
UPDATE ""Jobs""
SET
  ""JobRunningCode"" = CASE
    WHEN substring(""JobNumber"" from 7) ~ '^[0-9]+$' THEN
      CASE
        WHEN (substring(""JobNumber"" from 7))::int < 1000 THEN lpad(((substring(""JobNumber"" from 7))::int)::text, 3, '0')
        ELSE ((substring(""JobNumber"" from 7))::int)::text
      END
    ELSE ""JobRunningCode""
  END,
  ""JobNumber"" = CASE
    WHEN ""JobNumber"" ~ '^[0-9]{6}[0-9]+$' THEN
      substring(""JobNumber"" from 1 for 6) ||
      CASE
        WHEN (substring(""JobNumber"" from 7))::int < 1000 THEN lpad(((substring(""JobNumber"" from 7))::int)::text, 3, '0')
        ELSE ((substring(""JobNumber"" from 7))::int)::text
      END
    ELSE ""JobNumber""
  END
WHERE ""JobNumber"" IS NOT NULL AND ""JobNumber"" <> '';
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JobRunningCode",
                table: "Jobs");
        }
    }
}
