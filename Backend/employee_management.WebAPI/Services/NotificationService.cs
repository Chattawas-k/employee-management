using employee_management.Application.Common.Services;
using employee_management.WebAPI.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace employee_management.WebAPI.Services
{
    /// <summary>
    /// Implementation ของ INotificationService สำหรับส่ง real-time notifications ผ่าน SignalR
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IHubContext<NotificationHub> hubContext,
            ILogger<NotificationService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// ส่ง notification เมื่อมีงานใหม่ถูก assign
        /// </summary>
        public async Task SendJobAssignedNotificationAsync(string employeeId, string jobId, string jobTitle, string customer)
        {
            try
            {
                var groupName = $"Employee_{employeeId}";
                
                await _hubContext.Clients.Group(groupName).SendAsync(
                    "ReceiveJobAssigned",
                    jobId,
                    jobTitle,
                    customer
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending job assigned notification to Employee {employeeId}");
            }
        }

        /// <summary>
        /// ส่ง notification เมื่องานถูก update
        /// </summary>
        public async Task SendJobUpdatedNotificationAsync(string employeeId, string jobId, string jobTitle, string status)
        {
            try
            {
                var groupName = $"Employee_{employeeId}";
                
                await _hubContext.Clients.Group(groupName).SendAsync(
                    "ReceiveJobUpdated",
                    jobId,
                    jobTitle,
                    status
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending job updated notification to Employee {employeeId}");
            }
        }

        /// <summary>
        /// ส่ง notification ทั่วไป
        /// </summary>
        public async Task SendNotificationAsync(string employeeId, string message)
        {
            try
            {
                var groupName = $"Employee_{employeeId}";
                
                await _hubContext.Clients.Group(groupName).SendAsync(
                    "ReceiveNotification",
                    message
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending notification to Employee {employeeId}");
            }
        }

        /// <summary>
        /// ส่ง notification ไปยังหลายๆ employee
        /// </summary>
        public async Task SendNotificationToMultipleAsync(List<string> employeeIds, string message)
        {
            try
            {
                var tasks = employeeIds.Select(employeeId => SendNotificationAsync(employeeId, message));
                await Task.WhenAll(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending notification to multiple employees");
            }
        }

        /// <summary>
        /// ส่ง notification broadcast ถึงทุกคน
        /// </summary>
        public async Task SendBroadcastNotificationAsync(string message)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync(
                    "ReceiveNotification",
                    message
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending broadcast notification");
            }
        }
    }
}

