using FluentValidation;

namespace employee_management.Application.Features.Queues.Commands.BulkUpdate
{
    public sealed class BulkUpdateValidator : AbstractValidator<BulkUpdateRequest>
    {
        public BulkUpdateValidator()
        {
            RuleFor(x => x)
                .Must(x =>
                    (x.Queues != null && x.Queues.Count > 0) ||
                    (x.DeletedQueueIds != null && x.DeletedQueueIds.Count > 0))
                .WithMessage("At least one queue update or deletion must be provided.");

            When(x => x.Queues != null && x.Queues.Count > 0, () =>
            {
                RuleForEach(x => x.Queues)
                    .ChildRules(queue =>
                    {
                        queue.RuleFor(q => q.Id)
                            .NotEmpty().WithMessage("Queue Id is required.");

                        queue.RuleFor(q => q.Position)
                            .GreaterThan(0).WithMessage("Position must be greater than 0.");

                        queue.RuleFor(q => q.Status)
                            .IsInEnum().WithMessage("Invalid queue status.");
                    });

                RuleFor(x => x.Queues)
                    .Must(queues => queues.Select(q => q.Id).Distinct().Count() == queues.Count)
                    .WithMessage("Duplicate queue IDs are not allowed.");

                RuleFor(x => x.Queues)
                    .Must(queues => queues.Select(q => q.Position).Distinct().Count() == queues.Count)
                    .WithMessage("Duplicate positions are not allowed.");
            });

            When(x => x.DeletedQueueIds != null && x.DeletedQueueIds.Count > 0, () =>
            {
                RuleFor(x => x.DeletedQueueIds!)
                    .Must(ids => ids.All(id => id != Guid.Empty))
                    .WithMessage("Deleted queue IDs must be valid GUIDs.")
                    .Must(ids => ids.Distinct().Count() == ids.Count)
                    .WithMessage("Duplicate deleted queue IDs are not allowed.");
            });

            RuleFor(x => x)
                .Must(x =>
                {
                    if (x.Queues == null || x.DeletedQueueIds == null) return true;
                    var updateIds = x.Queues.Select(q => q.Id).ToHashSet();
                    return !x.DeletedQueueIds.Any(updateIds.Contains);
                })
                .WithMessage("Queue IDs cannot be both updated and deleted in the same request.");
        }
    }
}

