using MediatR;

namespace employee_management.Application.Features.Positions.Commands.Update
{
    public sealed class UpdateRequest : IRequest<UpdateResponse>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid DepartmentId { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
