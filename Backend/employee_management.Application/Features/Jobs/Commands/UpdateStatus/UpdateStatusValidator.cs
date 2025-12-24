using FluentValidation;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Commands.UpdateStatus
{
    public sealed class UpdateStatusValidator : AbstractValidator<UpdateStatusRequest>
    {
        public UpdateStatusValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required.");

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Status must be a valid JobStatus value.");

            RuleFor(x => x.RejectReason)
                .NotEmpty()
                .When(x => x.Status == JobStatus.Rejected)
                .WithMessage("Reject reason is required when status is Rejected.");

            RuleFor(x => x.Report)
                .NotNull()
                .When(x => x.Status == JobStatus.Done)
                .WithMessage("Report is required when status is Done.");

            When(x => x.Report != null, () =>
            {
                RuleFor(x => x.Report!.CustomerName)
                    .NotEmpty().WithMessage("Customer name is required in report.");

                RuleFor(x => x.Report!.SalesStatus)
                    .Must(status => status == "success" || status == "failed" || status == "pending")
                    .WithMessage("Sales status must be 'success', 'failed', or 'pending'.");
            });
        }
    }
}

