using employee_management.Application.Features.Employees.Queries.Get;

namespace employee_management.Application.Features.Employees.Commands.UpdateMyAvatar
{
    public sealed record UpdateMyAvatarResponse(
        EmployeeGetResponse Employee
    );
}

