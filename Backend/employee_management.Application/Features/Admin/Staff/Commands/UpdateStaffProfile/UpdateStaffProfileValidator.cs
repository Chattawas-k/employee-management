using FluentValidation;

namespace employee_management.Application.Features.Admin.Staff.Commands.UpdateStaffProfile
{
    public sealed class UpdateStaffProfileValidator : AbstractValidator<UpdateStaffProfileRequest>
    {
        private const int MaxDataUrlLength = 3_000_000; // ~2MB binary base64 + header

        public UpdateStaffProfileValidator()
        {
            RuleFor(x => x.StaffId)
                .NotEmpty().WithMessage("StaffId is required.");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("FullName is required.")
                .MaximumLength(200).WithMessage("FullName is too long.");

            RuleFor(x => x.PositionId)
                .NotEmpty().WithMessage("PositionId is required.");

            RuleFor(x => x.ProfileImageDataUrl)
                .Must(url => url == null || url.Length <= MaxDataUrlLength)
                .WithMessage("Profile image is too large.");

            RuleFor(x => x.ProfileImageDataUrl)
                .Must(url => url == null || url.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Profile image must be an image data URL.")
                .When(x => !string.IsNullOrWhiteSpace(x.ProfileImageDataUrl));
        }
    }
}

