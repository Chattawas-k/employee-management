namespace employee_management.Application.Features.Admin.Staff.Models
{
    public sealed record StaffListItemDto(
        Guid StaffId,
        string FullName,
        Guid PositionId,
        string Position,
        string? ProfileImageUrl,
        string Email,
        string UserName,
        AccountStatus AccountStatus,
        List<string> Roles
    );
}

