using FluentValidation;

namespace employee_management.Application.Features.Queues.Commands.Update
{
    public sealed class UpdateValidator : AbstractValidator<UpdateQueueRequest>
    {
        public UpdateValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required.");
            RuleFor(x => x.Position).GreaterThan(0).WithMessage("Position must be greater than 0.");
        }
    }
}

