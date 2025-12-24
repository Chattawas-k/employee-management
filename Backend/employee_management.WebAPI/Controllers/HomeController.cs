using Microsoft.AspNetCore.Mvc;

namespace employee_management.WebAPI.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
