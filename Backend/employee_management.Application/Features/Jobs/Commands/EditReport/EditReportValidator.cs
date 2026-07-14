using FluentValidation;

namespace employee_management.Application.Features.Jobs.Commands.EditReport
{
    public sealed class EditReportValidator : AbstractValidator<EditReportRequest>
    {
        public EditReportValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required.");

            RuleFor(x => x.Report)
                .NotNull().WithMessage("Report is required.");

            When(x => x.Report != null, () =>
            {
                RuleFor(x => x.Report.CustomerName)
                    .NotEmpty().WithMessage("Customer name is required in report.");

                RuleFor(x => x.Report.SalesStatus)
                    .Must(status => status == "success" || status == "failed" || status == "pending")
                    .WithMessage("Sales status must be 'success', 'failed', or 'pending'.");

                RuleFor(x => x.Report.SaleValue)
                    .GreaterThanOrEqualTo(0)
                    .When(x => x.Report.SaleValue.HasValue)
                    .WithMessage("Sale value cannot be negative.");
            });
        }
    }
}
