using AutoMapper;
using MediatR;
using employee_management.Application.Common.Exceptions;
using employee_management.Application.Repository;
using employee_management.Application.Repository.QueuesRepository;

namespace employee_management.Application.Features.Queues.Commands.Update
{
    public sealed class UpdateHandler : IRequestHandler<UpdateQueueRequest, UpdateQueueResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IQueueRepository _queueRepository;
        private readonly IMapper _mapper;

        public UpdateHandler(IUnitOfWork unitOfWork, IQueueRepository queueRepository, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _queueRepository = queueRepository;
            _mapper = mapper;
        }

        public async Task<UpdateQueueResponse> Handle(UpdateQueueRequest request, CancellationToken cancellationToken)
        {
            var queue = await _queueRepository.Get(request.Id, cancellationToken);
            if (queue == null)
            {
                throw new NoDataFoundException($"Queue with Id {request.Id} not found.");
            }

            _mapper.Map(request, queue);
            _queueRepository.Update(queue);
            await _unitOfWork.Save(cancellationToken);

            return _mapper.Map<UpdateQueueResponse>(queue);
        }
    }
}

