using MediatR;
using System;

namespace employee_management.Application.Features.Users.Add
{
    public sealed record class AddUserRequest(
        string UserName,
        string Email,
        string Password,
        string? Role // Optional: assign a role at registration
    ) : IRequest<AddUserResponse>;
}