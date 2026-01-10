using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using employee_management.Application.Features.ProductCategories.Queries.GetAll;
using employee_management.Application.Features.ProductCategories.Queries.GetById;
using employee_management.Application.Features.ProductCategories.Queries.GetDropdownList;
using employee_management.Application.Features.ProductCategories.Commands.Create;
using employee_management.Application.Features.ProductCategories.Commands.Update;
using employee_management.Application.Features.ProductCategories.Commands.Delete;
using employee_management.WebAPI.Controllers.Base;

namespace employee_management.WebAPI.Controllers
{
    [ApiController]
    [Route("api/v1/productcategory")]
    [Authorize(Policy = "AdminOnly")]
    public class ProductCategoryController : BaseController
    {
        private readonly IMediator _mediator;

        public ProductCategoryController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<GetAllResponse>> GetAll(CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetAllRequest(), cancellationToken);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GetByIdResponse>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetByIdRequest(id), cancellationToken);
            if (response.ProductCategory == null)
            {
                return NotFound();
            }
            return Ok(response);
        }

        [HttpGet("dropdown-list")]
        [AllowAnonymous]
        public async Task<ActionResult<GetDropdownListResponse>> GetDropdownList(CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(new GetDropdownListRequest(), cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<CreateProductCategoryResponse>> Create(
            [FromBody] CreateProductCategoryRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _mediator.Send(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UpdateProductCategoryResponse>> Update(
            Guid id,
            [FromBody] UpdateProductCategoryRequest request,
            CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID in URL does not match ID in body.");
            }
            var response = await _mediator.Send(request, cancellationToken);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            await _mediator.Send(new DeleteProductCategoryRequest(id), cancellationToken);
            return NoContent();
        }
    }
}
