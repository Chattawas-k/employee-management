using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository.TestTakersRepository;
using System.Threading;
using System.Threading.Tasks;

namespace employee_management.Application.Features.TestTakers.Queries.Get
{
    public sealed class GetHandler : IRequestHandler<GetRequest, GetTestTakerResponse>
    {
        private readonly ITestTakerRepository _testTakerRepository;
        private readonly IMapper _mapper;

        public GetHandler(ITestTakerRepository testTakerRepository, IMapper mapper)
        {
            _testTakerRepository = testTakerRepository;
            _mapper = mapper;
        }

        public async Task<GetTestTakerResponse> Handle(GetRequest request, CancellationToken cancellationToken)
        {
            var testTaker = await _testTakerRepository.Get(request.Id, cancellationToken);

            if (testTaker == null)
            {
                throw new NoDataFoundException($"TestTaker with Id {request.Id} not found.");
            }

            return _mapper.Map<GetTestTakerResponse>(testTaker);
        }
    }
}
