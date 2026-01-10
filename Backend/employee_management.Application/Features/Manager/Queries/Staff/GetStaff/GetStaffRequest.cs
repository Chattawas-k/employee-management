using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Staff.GetStaff
{
    public sealed record GetStaffRequest(
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<GetStaffResponse>;
}
