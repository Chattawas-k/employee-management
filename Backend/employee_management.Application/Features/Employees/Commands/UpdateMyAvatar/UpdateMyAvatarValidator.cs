using FluentValidation;

namespace employee_management.Application.Features.Employees.Commands.UpdateMyAvatar
{
    public sealed class UpdateMyAvatarValidator : AbstractValidator<UpdateMyAvatarRequest>
    {
        private const int MaxDataUrlLength = 3_000_000; // ~2MB binary base64 + header

        public UpdateMyAvatarValidator()
        {
            RuleFor(x => x.EmployeeId)
                .NotEmpty().WithMessage("EmployeeId is required.");

            RuleFor(x => x.AvatarDataUrl)
                .Must(url => url == null || url.Length <= MaxDataUrlLength)
                .WithMessage("Avatar is too large.");

            RuleFor(x => x.AvatarDataUrl)
                .Must(url => url == null || url.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Avatar must be an image data URL.")
                .When(x => !string.IsNullOrWhiteSpace(x.AvatarDataUrl));
        }
    }
}

