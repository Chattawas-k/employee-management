using FluentValidation;
using employee_management.Application.Repository.PositionsRepository;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Employees.Commands.Add
{
    public sealed class AddValidator : AbstractValidator<AddRequest>
    {
        public AddValidator(IPositionRepository positionRepository, ILogger<AddValidator> logger)
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

            RuleFor(x => x.Phone)
                .Matches(@"^[\d\s\-\+\(\)]+$")
                .When(x => !string.IsNullOrWhiteSpace(x.Phone))
                .WithMessage("Phone number format is invalid.");

            RuleFor(x => x.PositionId)
                .NotEmpty().WithMessage("PositionId is required.")
                .MustAsync(async (positionId, cancellation) =>
                {
                    if (positionId == Guid.Empty)
                        return false;
                    
                    try
                    {
                        var position = await positionRepository.Get(positionId, cancellation);
                        return position != null;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error validating PositionId: {PositionId}", positionId);
                        return false;
                    }
                })
                .WithMessage("PositionId does not exist.");

            RuleFor(x => x.Avatar)
                .Must(avatar => string.IsNullOrWhiteSpace(avatar) || Uri.TryCreate(avatar, UriKind.Absolute, out _))
                .When(x => !string.IsNullOrWhiteSpace(x.Avatar))
                .WithMessage("Avatar must be a valid URL.");
        }
    }
}

