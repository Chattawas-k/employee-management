using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Employees.Commands.Update
{
    public sealed class UpdateRequest : IRequest<UpdateResponse>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
        public Guid PositionId { get; set; }
        public string? Avatar { get; set; }
    }
}

