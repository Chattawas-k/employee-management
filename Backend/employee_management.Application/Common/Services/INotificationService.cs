namespace employee_management.Application.Common.Services
{
    /// <summary>
    /// Interface สำหรับส่ง real-time notifications
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// ส่ง notification เมื่อมีงานใหม่ถูก assign
        /// </summary>
        Task SendJobAssignedNotificationAsync(string employeeId, string jobId, string jobTitle, string customer);

        /// <summary>
        /// ส่ง notification เมื่องานถูก update
        /// </summary>
        Task SendJobUpdatedNotificationAsync(string employeeId, string jobId, string jobTitle, string status);

        /// <summary>
        /// ส่ง notification ทั่วไป
        /// </summary>
        Task SendNotificationAsync(string employeeId, string message);

        /// <summary>
        /// ส่ง notification ไปยังหลายๆ employee
        /// </summary>
        Task SendNotificationToMultipleAsync(List<string> employeeIds, string message);

        /// <summary>
        /// ส่ง notification broadcast ถึงทุกคน
        /// </summary>
        Task SendBroadcastNotificationAsync(string message);
    }
}

