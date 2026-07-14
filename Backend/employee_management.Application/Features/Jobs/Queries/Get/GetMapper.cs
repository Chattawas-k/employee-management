using AutoMapper;
using employee_management.Application.Common.Helpers;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Jobs.Queries.Get
{
    public sealed class GetMapper : Profile
    {
        public GetMapper()
        {
            CreateMap<Job, JobGetResponse>()
                .ForCtorParam(nameof(JobGetResponse.JobNumber),
                    opt => opt.MapFrom(src => src.JobNumber))
                .ForCtorParam(nameof(JobGetResponse.JobRunningCode),
                    opt => opt.MapFrom(src => src.JobRunningCode))
                .ForCtorParam(nameof(JobGetResponse.AssigneeName),
                    opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForCtorParam(nameof(JobGetResponse.StatusLogs),
                    opt => opt.MapFrom(src => src.StatusLogs))
                .ForCtorParam(nameof(JobGetResponse.Report),
                    opt => opt.MapFrom(src => src.Report));

            CreateMap<StatusLog, JobStatusLogDto>();
            CreateMap<JobReport, JobFullReportDto>()
                .ForCtorParam(nameof(JobFullReportDto.SaleValue),
                    opt => opt.MapFrom(src => src.SaleValue ?? SalesAmountHelper.ExtractSalesAmount(src.Description)))
                .ForCtorParam(nameof(JobFullReportDto.SaleDate),
                    opt => opt.MapFrom(src => src.SaleDate));
        }
    }
}

