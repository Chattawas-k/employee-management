using MediatR;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.Departments.Queries.GetAll;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    public class DepartmentController : BaseController
    {
        private readonly IMediator _mediator;

        public DepartmentController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<GetAllDepartmentsResponse>>> GetAll(CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetAllRequest(), cancellationToken);
            return Ok(response);
        }
    }
}

