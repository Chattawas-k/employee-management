using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Jobs.Queries.GetMyTasks
{
    public sealed class GetMyTasksMapper : Profile
    {
        public GetMyTasksMapper()
        {
            CreateMap<Job, JobDto>()
                .ForCtorParam(nameof(JobDto.AssigneeName),
                    opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForCtorParam(nameof(JobDto.StatusLogs),
                    opt => opt.MapFrom(src => src.StatusLogs))
                .ForCtorParam(nameof(JobDto.Report),
                    opt => opt.MapFrom(src => src.Report));

            CreateMap<StatusLog, MyTaskStatusLogDto>();
            CreateMap<JobReport, MyTaskJobReportDto>();
        }
    }
}

