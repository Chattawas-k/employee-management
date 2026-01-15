using FluentValidation;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffAvailabilityStatus
{
    public sealed class SetStaffAvailabilityStatusValidator : AbstractValidator<SetStaffAvailabilityStatusRequest>
    {
        public SetStaffAvailabilityStatusValidator()
        {
            RuleFor(x => x.StaffId)
                .NotEmpty().WithMessage("StaffId is required.");

            RuleFor(x => x.ChangedByEmployeeId)
                .NotEmpty().WithMessage("ChangedByEmployeeId is required.");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required.")
                .Must(BeAllowedStatus).WithMessage("Invalid status. Allowed: available, lunchBreak, unavailable, leave, offsiteCustomer.");
        }

        private static bool BeAllowedStatus(string status)
        {
            var normalized = (status ?? string.Empty).Trim().Replace(" ", string.Empty).ToLowerInvariant();
            return normalized is "available" or "lunchbreak" or "unavailable" or "leave" or "offsitecustomer";
        }
    }
}

