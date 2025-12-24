using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Common.Exceptions;

namespace employee_management.WebAPI.Controllers
{
    public class TestErrorController : ControllerBase
    {
        [HttpGet("badrequest")]
        public IActionResult BadRequestTest()
        {
            throw new BadRequestException("This is a bad request test.");
        }

        [HttpGet("badrequest-multi")]
        public IActionResult BadRequestMultiTest()
        {
            // Throw BadRequestException with multiple validation messages
            throw new BadRequestException(new[] { "Email is required.", "FirstName must be at least 2 characters." });
        }

        [HttpGet("notfound")]
        public IActionResult NotFoundTest()
        {
            throw new NoDataFoundException("Test data not found.");
        }

        [HttpGet("cancel")]
        public IActionResult CancelTest()
        {
            throw new OperationCanceledException("Operation canceled for testing.");
        }

        [HttpGet("server")]
        public IActionResult ServerTest()
        {
            throw new System.Exception("Unhandled exception for testing.");
        }

        [HttpGet("ok")]
        public IActionResult OkTest()
        {
            return Ok(new { message = "No error - test endpoint" });
        }
    }
}
