using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.SalesReasonsRepository;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.SalesReasons.Commands.Create
{
    public sealed class CreateSalesReasonHandler : IRequestHandler<CreateSalesReasonRequest, SalesReasonUpsertResponse>
    {
        private readonly ISalesReasonRepository _salesReasonRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateSalesReasonHandler(ISalesReasonRepository salesReasonRepository, IUnitOfWork unitOfWork)
        {
            _salesReasonRepository = salesReasonRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<SalesReasonUpsertResponse> Handle(CreateSalesReasonRequest request, CancellationToken cancellationToken)
        {
            var exists = await _salesReasonRepository.ExistsAsync(request.Type, request.Label, null, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException($"Sales reason '{request.Label}' already exists for type '{request.Type}'.");
            }

            var entity = new SalesReason
            {
                Id = Guid.NewGuid(),
                Type = request.Type,
                Label = request.Label.Trim(),
                IsActive = request.IsActive,
                SortOrder = request.SortOrder,
                IsDeleted = false
            };

            _salesReasonRepository.Create(entity);
            await _unitOfWork.Save(cancellationToken);

            return new SalesReasonUpsertResponse(entity.Id, entity.Type, entity.Label, entity.IsActive, entity.SortOrder);
        }
    }
}

