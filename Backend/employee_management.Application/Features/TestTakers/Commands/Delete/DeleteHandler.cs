using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.TestTakersRepository;
using System.Threading;
using System.Threading.Tasks;

namespace employee_management.Application.Features.TestTakers.Commands.Delete
{
    public sealed class DeleteHandler : IRequestHandler<DeleteRequest,Unit>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITestTakerRepository _testTakerRepository;

        public DeleteHandler(IUnitOfWork unitOfWork, ITestTakerRepository testTakerRepository)
        {
            _unitOfWork = unitOfWork;
            _testTakerRepository = testTakerRepository;
        }

        public async Task<Unit> Handle(DeleteRequest request, CancellationToken cancellationToken)
        {
            var testTaker = await _testTakerRepository.Get(request.Id, cancellationToken);
            if (testTaker == null)
            {
                throw new NoDataFoundException($"TestTaker with Id {request.Id} not found.");
            }

            _testTakerRepository.Delete(testTaker);
            await _unitOfWork.Save(cancellationToken);

            return Unit.Value;
        }
    }
}
