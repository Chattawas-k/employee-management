using AutoMapper;
using MediatR;
using employee_management.Application.Repository;
using employee_management.Application.Repository.QueuesRepository;

namespace employee_management.Application.Features.Queues.Commands.Add
{
    public sealed class AddHandler : IRequestHandler<AddQueueRequest, AddQueueResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly IMapper _mapper;

        public AddHandler(IUnitOfWork unitOfWork, 
            IQueueRepository queueRepository, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _mapper = mapper;
        }

        public async Task<AddQueueResponse> Handle(AddQueueRequest request,
            CancellationToken cancellationToken)
        {
            var queue = _mapper.Map<Domain.Entities.Queue>(request);
            _queueRepository.Create(queue);
            await _unitOfWork.Save(cancellationToken);

            return _mapper.Map<AddQueueResponse>(queue);
        }
    }
}

