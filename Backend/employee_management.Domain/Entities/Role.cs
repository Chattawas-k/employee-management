using Microsoft.AspNetCore.Identity;
using System;

namespace employee_management.Domain.Entities
{
    public class Role : IdentityRole<Guid>
    {
        public Role() : base()
        {
        }

        public Role(string roleName) : base(roleName)
        {
        }
    }
}