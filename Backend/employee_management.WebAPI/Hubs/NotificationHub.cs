using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace employee_management.WebAPI.Hubs
{
    /// <summary>
    /// SignalR Hub สำหรับ real-time notifications
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// เรียกเมื่อ client เชื่อมต่อ
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var employeeId = GetEmployeeIdFromContext();
            var userName = GetUserNameFromContext();

            // Auto-join room สำหรับ employee นี้
            if (!string.IsNullOrEmpty(employeeId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Employee_{employeeId}");
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// เรียกเมื่อ client ตัดการเชื่อมต่อ
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var employeeId = GetEmployeeIdFromContext();
            var userName = GetUserNameFromContext();

            if (exception != null)
            {
                _logger.LogWarning($"⚠️ Client disconnected with error: ConnectionId={Context.ConnectionId}, EmployeeId={employeeId}, Error={exception.Message}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// เข้าร่วม room สำหรับ employee (เรียกจาก client)
        /// </summary>
        public async Task JoinEmployeeRoom(string employeeId)
        {
            if (string.IsNullOrEmpty(employeeId))
            {
                _logger.LogWarning("⚠️ JoinEmployeeRoom called with empty employeeId");
                return;
            }

            var groupName = $"Employee_{employeeId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            
            // ส่ง confirmation กลับไปยัง client
            await Clients.Caller.SendAsync("JoinedRoom", groupName);
        }

        /// <summary>
        /// ออกจาก room สำหรับ employee (เรียกจาก client)
        /// </summary>
        public async Task LeaveEmployeeRoom(string employeeId)
        {
            if (string.IsNullOrEmpty(employeeId))
            {
                _logger.LogWarning("⚠️ LeaveEmployeeRoom called with empty employeeId");
                return;
            }

            var groupName = $"Employee_{employeeId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        /// <summary>
        /// ส่งข้อความถึง employee คนใดคนหนึ่ง
        /// </summary>
        public async Task SendToEmployee(string employeeId, string message)
        {
            var groupName = $"Employee_{employeeId}";
            await Clients.Group(groupName).SendAsync("ReceiveNotification", message);
        }

        /// <summary>
        /// ส่งข้อความ broadcast ถึงทุกคน
        /// </summary>
        public async Task SendToAll(string message)
        {
            await Clients.All.SendAsync("ReceiveNotification", message);
        }

        /// <summary>
        /// ดึง EmployeeId จาก JWT claims
        /// </summary>
        private string GetEmployeeIdFromContext()
        {
            return Context.User?.FindFirst("EmployeeId")?.Value ?? string.Empty;
        }

        /// <summary>
        /// ดึง UserName จาก JWT claims
        /// </summary>
        private string GetUserNameFromContext()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? 
                   Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")?.Value ?? 
                   string.Empty;
        }

        /// <summary>
        /// ดึง roles จาก JWT claims
        /// </summary>
        private List<string> GetRolesFromContext()
        {
            var roles = Context.User?.FindAll(ClaimTypes.Role)
                        .Select(c => c.Value)
                        .ToList();

            if (roles == null || !roles.Any())
            {
                roles = Context.User?.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                        .Select(c => c.Value)
                        .ToList();
            }

            return roles ?? new List<string>();
        }
    }
}

