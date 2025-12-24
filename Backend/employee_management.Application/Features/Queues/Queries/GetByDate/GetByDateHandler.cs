using AutoMapper;
using MediatR;
using employee_management.Application.Repository.QueuesRepository;

namespace employee_management.Application.Features.Queues.Queries.GetByDate
{
    public sealed class GetByDateHandler : IRequestHandler<GetByDateRequest, List<GetByDateResponse>>
    {
        private readonly IQueueRepository _queueRepository;
        private readonly IMapper _mapper;

        public GetByDateHandler(IQueueRepository queueRepository, IMapper mapper)
        {
            _queueRepository = queueRepository;
            _mapper = mapper;
        }

        public async Task<List<GetByDateResponse>> Handle(GetByDateRequest request, CancellationToken cancellationToken)
        {
            var queues = await _queueRepository.GetByDateAsync(request.Date, cancellationToken);
            return _mapper.Map<List<GetByDateResponse>>(queues);
        }
    }
}

