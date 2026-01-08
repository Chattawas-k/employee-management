using FluentValidation;

namespace employee_management.Application.Features.Queues.Commands.Archive
{
    public sealed class ArchiveValidator : AbstractValidator<ArchiveRequest>
    {
        public ArchiveValidator()
        {
            RuleFor(x => x.SourceDate)
                .NotEmpty().WithMessage("Source date is required.");

            RuleFor(x => x)
                .Must(x => x.TargetDate == null || x.TargetDate >= x.SourceDate)
                .WithMessage("Target date must be greater than or equal to source date.");
        }
    }
}

