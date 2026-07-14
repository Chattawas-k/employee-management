using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Jobs.Commands.EditReport
{
    public sealed class EditReportMapper : Profile
    {
        public EditReportMapper()
        {
            // Reasons labels are materialized in the handler from ReasonIds; ClosedByAdmin* set on override.
            CreateMap<EditReportDto, JobReport>()
                .ForMember(dest => dest.Reasons, opt => opt.Ignore())
                .ForMember(dest => dest.ClosedByAdminId, opt => opt.Ignore())
                .ForMember(dest => dest.ClosedByAdminName, opt => opt.Ignore());
        }
    }
}
