using MediatR;

namespace employee_management.Application.Features.Manager.Queries.Staff.GetStaffDetail
{
    public sealed record GetStaffDetailRequest(
        Guid StaffId,
        DateTime? DateFrom,
        DateTime? DateTo
    ) : IRequest<GetStaffDetailResponse>;
}
