using MediatR;

namespace employee_management.Application.Features.TestTakers.Commands.Update
{
    public sealed record UpdateTestTakerRequest(
        Guid Id,
        string Email,
        string FirstName,
        string LastName,
        string FormNumber,
        string BannerID) : IRequest<UpdateTestTakerResponse>;
}
