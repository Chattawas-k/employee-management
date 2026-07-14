using MediatR;

namespace employee_management.Application.Features.Jobs.Commands.EditReport
{
    public sealed class EditReportRequest : IRequest<EditReportResponse>
    {
        public Guid Id { get; set; }
        public EditReportDto Report { get; set; } = new EditReportDto();
        public string? EditNote { get; set; }
        public bool IsAdminOverride { get; set; } = false;
    }

    public sealed class EditReportDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerContact { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty; // "success" | "failed" | "pending"
        public List<Guid> ReasonIds { get; set; } = new List<Guid>();
        public string ProductCategory { get; set; } = string.Empty; // comma-separated category names
        public string Description { get; set; } = string.Empty;
        public decimal? SaleValue { get; set; }
        public DateTimeOffset? SaleDate { get; set; }
    }
}
