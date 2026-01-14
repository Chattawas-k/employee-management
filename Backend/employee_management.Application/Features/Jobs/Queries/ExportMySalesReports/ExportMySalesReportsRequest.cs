using MediatR;

namespace employee_management.Application.Features.Jobs.Queries.ExportMySalesReports
{
    public sealed record ExportMySalesReportsRequest(Guid EmployeeId) : IRequest<ExportMySalesReportsResponse>;
}

