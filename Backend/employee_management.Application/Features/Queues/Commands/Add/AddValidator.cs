using FluentValidation;

namespace employee_management.Application.Features.Queues.Commands.Add
{
    public sealed class AddValidator : AbstractValidator<AddQueueRequest>
    {
        public AddValidator()
        {
            RuleFor(x => x.EmployeeId).NotEmpty().WithMessage("EmployeeId is required.");
            RuleFor(x => x.Position).GreaterThan(0).WithMessage("Position must be greater than 0.");
            RuleFor(x => x.QueueDate).NotEmpty().WithMessage("QueueDate is required.");
        }
    }
}

