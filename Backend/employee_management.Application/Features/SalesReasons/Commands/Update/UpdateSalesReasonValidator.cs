using FluentValidation;

namespace employee_management.Application.Features.SalesReasons.Commands.Update
{
    public sealed class UpdateSalesReasonValidator : AbstractValidator<UpdateSalesReasonRequest>
    {
        public UpdateSalesReasonValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id ต้องไม่เป็นค่าว่าง");

            RuleFor(x => x.Label)
                .NotEmpty().WithMessage("เหตุผลต้องไม่เป็นค่าว่าง")
                .MaximumLength(200).WithMessage("เหตุผลต้องไม่เกิน 200 ตัวอักษร");

            RuleFor(x => x.SortOrder)
                .GreaterThanOrEqualTo(0).WithMessage("ลำดับต้องไม่ติดลบ");
        }
    }
}

