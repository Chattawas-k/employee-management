using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Employees.Queries.DropdownList
{
    public sealed record DropdownListRequest(
        EmployeeStatus? Status = null,
        Guid? DepartmentId = null,
        Guid? PositionId = null
    ) : IRequest<List<DropdownListResponse>>;
}

