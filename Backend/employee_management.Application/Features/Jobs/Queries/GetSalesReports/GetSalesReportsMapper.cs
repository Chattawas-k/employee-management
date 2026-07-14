using AutoMapper;
using employee_management.Application.Common.Helpers;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using System;
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
                .ForMember(dest => dest.SalesStatus, opt => opt.MapFrom(src =>
                    src.Report != null
                        ? src.Report.SalesStatus
                        : (src.Status == JobStatus.Cancelled ? "rejected" : string.Empty)))
                .ForMember(dest => dest.Reasons, opt => opt.MapFrom(src => src.Report != null ? src.Report.Reasons : new List<string>()))
                .ForMember(dest => dest.ProductCategory, opt => opt.MapFrom(src => src.Report != null ? src.Report.ProductCategory : string.Empty))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src =>
                    src.Report != null
                        ? src.Report.Description
                        : (src.Status == JobStatus.Cancelled ? ExtractCancelReason(src.StatusLogs) : string.Empty)))
                .ForMember(dest => dest.SubmittedAt, opt => opt.MapFrom(src => src.CreatedDate))
                .ForMember(dest => dest.SaleDate, opt => opt.MapFrom(src =>
                    src.Report != null && src.Report.SaleDate.HasValue
                        ? src.Report.SaleDate
                        : ((src.Status == JobStatus.ClosedWon || src.Status == JobStatus.ClosedLost) && src.Report != null && src.StatusLogs != null &&
                           (src.StatusLogs.Any(log => log.Status == "ClosedWon") || src.StatusLogs.Any(log => log.Status == "ClosedLost"))
                            ? src.StatusLogs.First(log => log.Status == "ClosedWon" || log.Status == "ClosedLost").Timestamp
                            : (DateTimeOffset?)null)))
                .ForMember(dest => dest.SaleValue, opt => opt.MapFrom(src =>
                    src.Report != null
                        ? (src.Report.SaleValue ?? SalesAmountHelper.ExtractSalesAmount(src.Report.Description))
                        : (decimal?)null))
                .ForMember(dest => dest.AssigneeId, opt => opt.MapFrom(src => src.AssigneeId))
                .ForMember(dest => dest.AssigneeName, opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : null))
                .ForMember(dest => dest.AssigneeAvatar, opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Avatar : null))
                .ForMember(dest => dest.InvoiceId, opt => opt.Ignore()) // InvoiceId will be set manually if needed
                .ForMember(dest => dest.ClosedByAdminName, opt => opt.MapFrom(src => src.Report != null ? src.Report.ClosedByAdminName : null));
        }

        private static string ExtractCancelReason(List<StatusLog> logs)
        {
            if (logs == null || logs.Count == 0) return string.Empty;

            // Prefer explicit "Cancelled: reason" log (latest)
            var cancelLog = logs
                .OrderByDescending(l => l.Timestamp)
                .FirstOrDefault(l => (l.Status ?? string.Empty).StartsWith("Cancelled", StringComparison.OrdinalIgnoreCase));

            if (cancelLog == null || string.IsNullOrWhiteSpace(cancelLog.Status))
            {
                return string.Empty;
            }

            var status = cancelLog.Status;
            var idx = status.IndexOf(':');
            if (idx < 0 || idx >= status.Length - 1)
            {
                return status;
            }

            return status[(idx + 1)..].Trim();
        }
    }
}

