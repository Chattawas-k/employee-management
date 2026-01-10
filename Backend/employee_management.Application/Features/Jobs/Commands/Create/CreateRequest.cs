using MediatR;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Commands.Create
{
    public sealed class CreateRequest : IRequest<CreateResponse>
    {
        public string Title { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid AssigneeId { get; set; }
        public JobPriority Priority { get; set; } = JobPriority.Normal;
        public string Channel { get; set; } = string.Empty; // "Phone", "Chat", "Walk-in", "Email"
        public Guid? ProductCategoryId { get; set; } // Optional: Product category ID
        public string? Category { get; set; } // Deprecated: Keep for backward compatibility
    }
}

