using AutoMapper;

namespace employee_management.Application.Features.Queues.Queries.GetMyQueueInfo
{
    public class GetMyQueueInfoMapper : Profile
    {
        public GetMyQueueInfoMapper()
        {
            // No mapping needed as we construct the response directly in the handler
        }
    }
}

