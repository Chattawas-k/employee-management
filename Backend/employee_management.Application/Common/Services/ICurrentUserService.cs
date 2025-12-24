
namespace employee_management.Application.Common.Services
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }
    }
}
