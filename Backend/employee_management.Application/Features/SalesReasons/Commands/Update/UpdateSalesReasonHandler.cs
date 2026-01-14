using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.SalesReasonsRepository;

namespace employee_management.Application.Features.SalesReasons.Commands.Update
{
    public sealed class UpdateSalesReasonHandler : IRequestHandler<UpdateSalesReasonRequest, SalesReasonUpsertResponse>
    {
        private readonly ISalesReasonRepository _salesReasonRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateSalesReasonHandler(ISalesReasonRepository salesReasonRepository, IUnitOfWork unitOfWork)
        {
            _salesReasonRepository = salesReasonRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<SalesReasonUpsertResponse> Handle(UpdateSalesReasonRequest request, CancellationToken cancellationToken)
        {
            var entity = await _salesReasonRepository.Get(request.Id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                throw new KeyNotFoundException($"Sales reason with ID '{request.Id}' not found.");
            }

            var exists = await _salesReasonRepository.ExistsAsync(request.Type, request.Label, request.Id, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException($"Sales reason '{request.Label}' already exists for type '{request.Type}'.");
            }

            entity.Type = request.Type;
            entity.Label = request.Label.Trim();
            entity.IsActive = request.IsActive;
            entity.SortOrder = request.SortOrder;

            _salesReasonRepository.Update(entity);
            await _unitOfWork.Save(cancellationToken);

            return new SalesReasonUpsertResponse(entity.Id, entity.Type, entity.Label, entity.IsActive, entity.SortOrder);
        }
    }
}

