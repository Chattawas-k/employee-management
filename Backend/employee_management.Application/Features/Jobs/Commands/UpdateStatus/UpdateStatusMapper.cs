using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Jobs.Commands.UpdateStatus
{
    public sealed class UpdateStatusMapper : Profile
    {
        public UpdateStatusMapper()
        {
            CreateMap<Job, UpdateStatusResponse>()
                .ForCtorParam(nameof(UpdateStatusResponse.AssigneeName),
                    opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForCtorParam(nameof(UpdateStatusResponse.StatusLogs),
                    opt => opt.MapFrom(src => src.StatusLogs))
                .ForCtorParam(nameof(UpdateStatusResponse.Report),
                    opt => opt.MapFrom(src => src.Report));

            CreateMap<UpdateStatusJobReportDto, JobReport>();
            CreateMap<JobReport, UpdateStatusJobReportDto>();
            CreateMap<StatusLog, UpdateStatusLogDto>();
        }
    }
}

