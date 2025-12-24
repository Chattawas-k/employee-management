using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Queues.Commands.Update
{
    public sealed class UpdateMapper : Profile
    {
        public UpdateMapper()
        {
            CreateMap<UpdateQueueRequest, Queue>();
            CreateMap<Queue, UpdateQueueResponse>();
        }
    }
}

