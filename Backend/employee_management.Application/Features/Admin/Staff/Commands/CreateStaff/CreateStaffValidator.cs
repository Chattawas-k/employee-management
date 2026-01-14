using FluentValidation;

namespace employee_management.Application.Features.Admin.Staff.Commands.CreateStaff
{
    public sealed class CreateStaffValidator : AbstractValidator<CreateStaffRequest>
    {
        private const int MaxDataUrlLength = 3_000_000; // ~2MB binary base64 + header

        public CreateStaffValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("FullName is required.")
                .MaximumLength(200).WithMessage("FullName is too long.");

            RuleFor(x => x.PositionId)
                .NotEmpty().WithMessage("PositionId is required.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Email is invalid.")
                .MaximumLength(256).WithMessage("Email is too long.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required.")
                .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required.")
                .Must(role => AllowedRoles.Contains(role))
                .WithMessage($"Role must be one of: {string.Join(", ", AllowedRoles)}");

            RuleFor(x => x.ProfileImageDataUrl)
                .Must(url => url == null || url.Length <= MaxDataUrlLength)
                .WithMessage("Profile image is too large.");

            RuleFor(x => x.ProfileImageDataUrl)
                .Must(url => url == null || url.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Profile image must be an image data URL.")
                .When(x => !string.IsNullOrWhiteSpace(x.ProfileImageDataUrl));
        }

        private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "Basic",
            "Manager",
            "Admin",
            "SuperAdmin"
        };
    }
}

