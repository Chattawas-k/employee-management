using AutoMapper;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;

namespace employee_management.Application.Features.Jobs.Queries.GetQueueSummary
{
    public sealed class GetQueueSummaryMapper : Profile
    {
        public GetQueueSummaryMapper()
        {
            CreateMap<Job, QueueSummaryJobDto>()
                .ForCtorParam(nameof(QueueSummaryJobDto.Id), opt => opt.MapFrom(src => src.Id))
                .ForCtorParam(nameof(QueueSummaryJobDto.JobNumber), opt => opt.MapFrom(src => src.JobNumber))
                .ForCtorParam(nameof(QueueSummaryJobDto.JobRunningCode), opt => opt.MapFrom(src => src.JobRunningCode))
                .ForCtorParam(nameof(QueueSummaryJobDto.Title), opt => opt.MapFrom(src => src.Title))
                .ForCtorParam(nameof(QueueSummaryJobDto.Customer), opt => opt.MapFrom(src => src.Customer))
                .ForCtorParam(nameof(QueueSummaryJobDto.Description), opt => opt.MapFrom(src => src.Description))
                .ForCtorParam(nameof(QueueSummaryJobDto.AssigneeId), opt => opt.MapFrom(src => src.AssigneeId))
                .ForCtorParam(nameof(QueueSummaryJobDto.AssigneeName), opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForCtorParam(nameof(QueueSummaryJobDto.Status), opt => opt.MapFrom(src => src.Status))
                .ForCtorParam(nameof(QueueSummaryJobDto.Priority), opt => opt.MapFrom(src => src.Priority))
                .ForCtorParam(nameof(QueueSummaryJobDto.CreatedDate), opt => opt.MapFrom(src => src.CreatedDate))
                .ForCtorParam(nameof(QueueSummaryJobDto.UpdatedDate), opt => opt.MapFrom(src => src.UpdatedDate))
                .ForCtorParam(nameof(QueueSummaryJobDto.StatusLogs), opt => opt.MapFrom(src => src.StatusLogs));

            CreateMap<StatusLog, QueueSummaryStatusLogDto>()
                .ForCtorParam(nameof(QueueSummaryStatusLogDto.Status), opt => opt.MapFrom(src => src.Status))
                .ForCtorParam(nameof(QueueSummaryStatusLogDto.Timestamp), opt => opt.MapFrom(src => src.Timestamp));
        }
    }
}

