using FluentValidation;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Commands.Create
{
    public sealed class CreateValidator : AbstractValidator<CreateRequest>
    {
        public CreateValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

            RuleFor(x => x.Customer)
                .NotEmpty().WithMessage("Customer is required.")
                .MaximumLength(200).WithMessage("Customer must not exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

            RuleFor(x => x.AssigneeId)
                .NotEmpty().WithMessage("Assignee ID is required.");

            RuleFor(x => x.Priority)
                .IsInEnum().WithMessage("Priority must be a valid JobPriority value.");
        }
    }
}

