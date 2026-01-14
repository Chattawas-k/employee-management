using FluentValidation;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffStatus
{
    public sealed class SetStaffStatusValidator : AbstractValidator<SetStaffStatusRequest>
    {
        public SetStaffStatusValidator()
        {
            RuleFor(x => x.StaffId)
                .NotEmpty().WithMessage("StaffId is required.");
        }
    }
}

