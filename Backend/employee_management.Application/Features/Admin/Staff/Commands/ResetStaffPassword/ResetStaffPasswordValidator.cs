using FluentValidation;

namespace employee_management.Application.Features.Admin.Staff.Commands.ResetStaffPassword
{
    public sealed class ResetStaffPasswordValidator : AbstractValidator<ResetStaffPasswordRequest>
    {
        public ResetStaffPasswordValidator()
        {
            RuleFor(x => x.StaffId)
                .NotEmpty().WithMessage("StaffId is required.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("NewPassword is required.")
                .MinimumLength(6).WithMessage("NewPassword must be at least 6 characters.");
        }
    }
}

