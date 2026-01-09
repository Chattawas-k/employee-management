using MediatR;

namespace employee_management.Application.Features.Positions.Commands.Delete
{
    public sealed class DeleteRequest : IRequest<Unit>
    {
        public Guid Id { get; set; }
    }
}
