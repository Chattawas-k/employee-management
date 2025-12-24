using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Commands.UpdateStatus
{
    public sealed class UpdateStatusRequest : IRequest<UpdateStatusResponse>
    {
        public Guid Id { get; set; }
        public JobStatus Status { get; set; }
        public string? RejectReason { get; set; }
        public UpdateStatusJobReportDto? Report { get; set; }
    }
}

