using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace employee_management.WebAPI.Controllers.Base
{
    [Route("api/v{version:apiVersion}/[controller]")]
    [Authorize]
    [ApiController]
    [ApiVersion("1.0")]
    public abstract class BaseController : ControllerBase
    {
    }
}
