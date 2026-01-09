using MediatR;

namespace employee_management.Application.Features.Positions.Commands.Add
{
    public sealed class AddRequest : IRequest<AddResponse>
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid DepartmentId { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
