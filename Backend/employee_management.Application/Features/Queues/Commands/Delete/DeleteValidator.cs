using FluentValidation;

namespace employee_management.Application.Features.Queues.Commands.Delete
{
    public sealed class DeleteValidator : AbstractValidator<DeleteRequest>
    {
        public DeleteValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required.");
        }
    }
}

