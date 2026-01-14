using FluentValidation;

namespace employee_management.Application.Features.Admin.Staff.Commands.SetStaffRole
{
    public sealed class SetStaffRoleValidator : AbstractValidator<SetStaffRoleRequest>
    {
        public SetStaffRoleValidator()
        {
            RuleFor(x => x.StaffId)
                .NotEmpty().WithMessage("StaffId is required.");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required.")
                .Must(role => AllowedRoles.Contains(role))
                .WithMessage($"Role must be one of: {string.Join(", ", AllowedRoles)}");
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

