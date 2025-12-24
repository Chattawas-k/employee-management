using FluentValidation;
using System.Text.RegularExpressions;

namespace employee_management.Application.Features.Users.Add
{
    public sealed class AddUserValidator : AbstractValidator<AddUserRequest>
    {
        public AddUserValidator()
        {
            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("UserName is required.")
                .MinimumLength(3).WithMessage("UserName must be at least 3 characters.")
                .MaximumLength(50).WithMessage("UserName must be at most 50 characters.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("A valid email is required.")
                .MaximumLength(100).WithMessage("Email must be at most 100 characters.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required.")
                .MinimumLength(6).WithMessage("Password must be at least 6 characters.")
                .Must(HasUppercase).WithMessage("Password must contain at least one uppercase letter.")
                .Must(HasLowercase).WithMessage("Password must contain at least one lowercase letter.")
                .Must(HasDigit).WithMessage("Password must contain at least one digit.")
                .Must(HasSpecial).WithMessage("Password must contain at least one special character.");

            RuleFor(x => x.Role)
                .MaximumLength(50).When(x => !string.IsNullOrWhiteSpace(x.Role))
                .WithMessage("Role must be at most 50 characters.");
        }

        private bool HasUppercase(string password) =>
            !string.IsNullOrEmpty(password) && password.Any(char.IsUpper);

        private bool HasLowercase(string password) =>
            !string.IsNullOrEmpty(password) && password.Any(char.IsLower);

        private bool HasDigit(string password) =>
            !string.IsNullOrEmpty(password) && password.Any(char.IsDigit);

        private bool HasSpecial(string password) =>
            !string.IsNullOrEmpty(password) && password.Any(ch => !char.IsLetterOrDigit(ch));
    }
}
