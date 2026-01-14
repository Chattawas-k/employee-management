namespace employee_management.Application.Features.Jobs.Queries.GetSalesReports
{
    public sealed record GetSalesReportsResponse(
        List<SalesReportDto> Reports
    );

    public sealed class SalesReportDto
    {
        public Guid Id { get; set; }
        public string JobNumber { get; set; } = string.Empty;
        public string? JobRunningCode { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerContact { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty;
        public List<string> Reasons { get; set; } = new List<string>();
        public string ProductCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTimeOffset SubmittedAt { get; set; }
        public DateTimeOffset? SaleDate { get; set; }
        public Guid AssigneeId { get; set; }
        public string? AssigneeName { get; set; }
        public string? AssigneeAvatar { get; set; }
        public string? InvoiceId { get; set; }
    }
}


