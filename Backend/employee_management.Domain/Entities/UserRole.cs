using Microsoft.AspNetCore.Identity;
using System;

namespace employee_management.Domain.Entities
{
    public class UserRole : IdentityUserRole<Guid>
    {
    }
}