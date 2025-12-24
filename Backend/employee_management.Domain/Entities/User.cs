using Microsoft.AspNetCore.Identity;
namespace employee_management.Domain.Entities
{
    public class User : IdentityUser<Guid>
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        
        // Link to Employee
        public Guid? EmployeeId { get; set; }
        public Employee? Employee { get; set; }
    }
}