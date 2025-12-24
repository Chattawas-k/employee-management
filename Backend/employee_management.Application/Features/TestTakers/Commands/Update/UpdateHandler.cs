using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.TestTakersRepository;
using System.Threading;
using System.Threading.Tasks;

namespace employee_management.Application.Features.TestTakers.Commands.Update
{
    public sealed class UpdateHandler : IRequestHandler<UpdateTestTakerRequest, UpdateTestTakerResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITestTakerRepository _testTakerRepository;
        private readonly IMapper _mapper;

        public UpdateHandler(IUnitOfWork unitOfWork, ITestTakerRepository testTakerRepository, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _testTakerRepository = testTakerRepository;
            _mapper = mapper;
        }

        public async Task<UpdateTestTakerResponse> Handle(UpdateTestTakerRequest request, CancellationToken cancellationToken)
        {
            var testTaker = await _testTakerRepository.Get(request.Id, cancellationToken);
            if (testTaker == null)
            {
                throw new NoDataFoundException($"TestTaker with Id {request.Id} not found.");
            }

            _mapper.Map(request, testTaker);
            _testTakerRepository.Update(testTaker);
            await _unitOfWork.Save(cancellationToken);

            return _mapper.Map<UpdateTestTakerResponse>(testTaker);
        }
    }
}
