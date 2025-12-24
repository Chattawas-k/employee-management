using AutoMapper;
using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.TestTakersRepository;
using employee_management.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace employee_management.Application.Features.TestTakers.Commands.Add
{
    public sealed class AddHandler : IRequestHandler<AddTestTakerRequest, AddTestTakerResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITestTakerRepository _testTakerRepository;
        private readonly IMapper _mapper;

        public AddHandler(IUnitOfWork unitOfWork, 
            ITestTakerRepository testTakerRepository, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _testTakerRepository = testTakerRepository;
            _mapper = mapper;
        }

        public async Task<AddTestTakerResponse> Handle(AddTestTakerRequest request,
            CancellationToken cancellationToken)
        {
            var testTaker = _mapper.Map<TestTaker>(request);
            _testTakerRepository.Create(testTaker);
            await _unitOfWork.Save(cancellationToken);

            return _mapper.Map<AddTestTakerResponse>(testTaker);
        }


    }
}
