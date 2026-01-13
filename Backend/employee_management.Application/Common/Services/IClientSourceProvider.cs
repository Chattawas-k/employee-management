using employee_management.Domain.Enums;

namespace employee_management.Application.Common.Services
{
    public interface IClientSourceProvider
    {
        StatusChangeSource GetSource();
    }
}

