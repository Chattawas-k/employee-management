using System;

namespace employee_management.Application.Features.Users.Add
{
    public sealed record class AddUserResponse
    {
        public Guid Id { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
    }
}