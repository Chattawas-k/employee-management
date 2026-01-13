using AutoMapper;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using System.Linq;

namespace employee_management.Application.Features.Jobs.Queries.GetSalesReports
{
    public sealed class GetSalesReportsMapper : Profile
    {
        public GetSalesReportsMapper()
        {
            CreateMap<Job, SalesReportDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.JobNumber, opt => opt.MapFrom(src => src.JobNumber))
                .ForMember(dest => dest.JobRunningCode, opt => opt.MapFrom(src => src.JobRunningCode))
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Report != null ? src.Report.CustomerName : src.Customer))
                .ForMember(dest => dest.CustomerContact, opt => opt.MapFrom(src => src.Report != null ? src.Report.CustomerContact : string.Empty))
                .ForMember(dest => dest.SalesStatus, opt => opt.MapFrom(src => src.Report != null ? src.Report.SalesStatus : string.Empty))
                .ForMember(dest => dest.Reasons, opt => opt.MapFrom(src => src.Report != null ? src.Report.Reasons : new List<string>()))
                .ForMember(dest => dest.ProductCategory, opt => opt.MapFrom(src => src.Report != null ? src.Report.ProductCategory : string.Empty))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Report != null ? src.Report.Description : string.Empty))
                .ForMember(dest => dest.SubmittedAt, opt => opt.MapFrom(src => src.CreatedDate))
                .ForMember(dest => dest.SaleDate, opt => opt.MapFrom(src => 
                    (src.Status == JobStatus.ClosedWon || src.Status == JobStatus.ClosedLost) && src.Report != null && src.StatusLogs != null && 
                    (src.StatusLogs.Any(log => log.Status == "ClosedWon") || src.StatusLogs.Any(log => log.Status == "ClosedLost")) ? 
                    src.StatusLogs.First(log => log.Status == "ClosedWon" || log.Status == "ClosedLost").Timestamp : 
                    (DateTimeOffset?)null))
                .ForMember(dest => dest.AssigneeId, opt => opt.MapFrom(src => src.AssigneeId))
                .ForMember(dest => dest.AssigneeName, opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForMember(dest => dest.InvoiceId, opt => opt.Ignore()); // InvoiceId will be set manually if needed
        }
    }
}

