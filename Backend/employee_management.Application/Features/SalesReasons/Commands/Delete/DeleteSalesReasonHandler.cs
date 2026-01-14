using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.SalesReasonsRepository;

namespace employee_management.Application.Features.SalesReasons.Commands.Delete
{
    public sealed class DeleteSalesReasonHandler : IRequestHandler<DeleteSalesReasonRequest>
    {
        private readonly ISalesReasonRepository _salesReasonRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteSalesReasonHandler(ISalesReasonRepository salesReasonRepository, IUnitOfWork unitOfWork)
        {
            _salesReasonRepository = salesReasonRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task Handle(DeleteSalesReasonRequest request, CancellationToken cancellationToken)
        {
            var entity = await _salesReasonRepository.Get(request.Id, cancellationToken);
            if (entity == null || entity.IsDeleted)
            {
                throw new KeyNotFoundException($"Sales reason with ID '{request.Id}' not found.");
            }

            _salesReasonRepository.Delete(entity);
            await _unitOfWork.Save(cancellationToken);
        }
    }
}

