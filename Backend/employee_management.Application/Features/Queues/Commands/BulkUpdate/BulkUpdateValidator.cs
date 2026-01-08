using FluentValidation;

namespace employee_management.Application.Features.Queues.Commands.BulkUpdate
{
    public sealed class BulkUpdateValidator : AbstractValidator<BulkUpdateRequest>
    {
        public BulkUpdateValidator()
        {
            RuleFor(x => x.Queues)
                .NotEmpty().WithMessage("Queues list cannot be empty.")
                .Must(queues => queues != null && queues.Count > 0).WithMessage("At least one queue must be provided.");

            RuleForEach(x => x.Queues)
                .ChildRules(queue =>
                {
                    queue.RuleFor(q => q.Id)
                        .NotEmpty().WithMessage("Queue Id is required.");

                    queue.RuleFor(q => q.Position)
                        .GreaterThan(0).WithMessage("Position must be greater than 0.");

                    queue.RuleFor(q => q.Status)
                        .IsInEnum().WithMessage("Invalid queue status.");
                });

            RuleFor(x => x.Queues)
                .Must(queues => queues.Select(q => q.Id).Distinct().Count() == queues.Count)
                .WithMessage("Duplicate queue IDs are not allowed.");

            RuleFor(x => x.Queues)
                .Must(queues => queues.Select(q => q.Position).Distinct().Count() == queues.Count)
                .WithMessage("Duplicate positions are not allowed.");
        }
    }
}

