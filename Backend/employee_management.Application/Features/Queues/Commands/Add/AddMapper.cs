using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Queues.Commands.Add
{
    public sealed class AddMapper : Profile
    {
        public AddMapper()
        {
            CreateMap<AddQueueRequest, Queue>();
            CreateMap<Queue, AddQueueResponse>();
        }
    }
}

