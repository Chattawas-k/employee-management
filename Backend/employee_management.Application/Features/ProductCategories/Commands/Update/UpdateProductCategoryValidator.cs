using FluentValidation;

namespace employee_management.Application.Features.ProductCategories.Commands.Update
{
    public sealed class UpdateProductCategoryValidator : AbstractValidator<UpdateProductCategoryRequest>
    {
        public UpdateProductCategoryValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("ID ต้องไม่เป็นค่าว่าง");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("ชื่อหมวดหมู่สินค้าต้องไม่เป็นค่าว่าง")
                .MaximumLength(100).WithMessage("ชื่อหมวดหมู่สินค้าต้องไม่เกิน 100 ตัวอักษร");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("คำอธิบายต้องไม่เกิน 500 ตัวอักษร")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }
}
