using MediatR;

namespace employee_management.Application.Features.SalesReasons.Commands.Delete
{
    public sealed record DeleteSalesReasonRequest(Guid Id) : IRequest;
}

