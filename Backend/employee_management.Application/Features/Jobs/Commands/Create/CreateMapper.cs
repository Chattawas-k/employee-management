using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Jobs.Commands.Create
{
    public sealed class CreateMapper : Profile
    {
        public CreateMapper()
        {
            CreateMap<Job, CreateResponse>()
                .ForCtorParam(nameof(CreateResponse.AssigneeName),
                    opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForCtorParam(nameof(CreateResponse.StatusLogs),
                    opt => opt.MapFrom(src => src.StatusLogs))
                .ForCtorParam(nameof(CreateResponse.Report),
                    opt => opt.MapFrom(src => src.Report));

            CreateMap<StatusLog, CreateStatusLogDto>();
            CreateMap<JobReport, CreateJobReportDto>();
        }
    }
}

