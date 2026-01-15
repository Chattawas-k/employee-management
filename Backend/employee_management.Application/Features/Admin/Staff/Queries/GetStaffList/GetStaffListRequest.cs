using MediatR;

namespace employee_management.Application.Features.Admin.Staff.Queries.GetStaffList
{
    public sealed record GetStaffListRequest(bool BasicOnly = false) : IRequest<GetStaffListResponse>;
}

