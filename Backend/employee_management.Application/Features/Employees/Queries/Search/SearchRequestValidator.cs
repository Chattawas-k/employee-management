using FluentValidation;

namespace employee_management.Application.Features.Employees.Queries.Search
{
    public sealed class SearchRequestValidator : AbstractValidator<SearchRequest>
    {
        public SearchRequestValidator()
        {
            RuleFor(x => x.PageNumber)
                .GreaterThanOrEqualTo(1)
                .WithMessage("PageNumber must be greater than or equal to 1.");

            RuleFor(x => x.PageSize)
                .GreaterThanOrEqualTo(1)
                .LessThanOrEqualTo(100)
                .WithMessage("PageSize must be between 1 and 100.");

            RuleFor(x => x.SortDirection)
                .Must(direction => string.IsNullOrWhiteSpace(direction) || 
                     direction.ToLowerInvariant() == "asc" || 
                     direction.ToLowerInvariant() == "desc")
                .WithMessage("SortDirection must be 'asc' or 'desc'.");
        }
    }
}

