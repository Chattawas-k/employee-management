using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Jobs.Queries.Get
{
    public sealed class GetMapper : Profile
    {
        public GetMapper()
        {
            CreateMap<Job, JobGetResponse>()
                .ForCtorParam(nameof(JobGetResponse.AssigneeName),
                    opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForCtorParam(nameof(JobGetResponse.StatusLogs),
                    opt => opt.MapFrom(src => src.StatusLogs))
                .ForCtorParam(nameof(JobGetResponse.Report),
                    opt => opt.MapFrom(src => src.Report));

            CreateMap<StatusLog, JobStatusLogDto>();
            CreateMap<JobReport, JobFullReportDto>();
        }
    }
}

