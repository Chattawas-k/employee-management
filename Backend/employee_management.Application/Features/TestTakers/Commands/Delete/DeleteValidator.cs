using FluentValidation;

namespace employee_management.Application.Features.TestTakers.Commands.Delete
{
    public sealed class DeleteValidator : AbstractValidator<DeleteRequest>
    {
        public DeleteValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
        }
    }
}
