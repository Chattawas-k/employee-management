using AutoMapper;
using employee_management.Domain.Entities;

namespace employee_management.Application.Features.Queues.Queries.GetByDate
{
    public sealed class GetByDateMapper : Profile
    {
        public GetByDateMapper()
        {
            CreateMap<Queue, GetByDateResponse>()
                .ForCtorParam(nameof(GetByDateResponse.Id), opt => opt.MapFrom(src => src.Id))
                .ForCtorParam(nameof(GetByDateResponse.EmployeeId), opt => opt.MapFrom(src => src.EmployeeId))
                .ForCtorParam(nameof(GetByDateResponse.EmployeeName), opt => opt.MapFrom(src => src.Employee != null ? src.Employee.Name : string.Empty))
                .ForCtorParam(nameof(GetByDateResponse.PositionName), opt => opt.MapFrom(src => src.Employee != null && src.Employee.Position != null ? src.Employee.Position.Name : null))
                .ForCtorParam(nameof(GetByDateResponse.DepartmentName), opt => opt.MapFrom(src => src.Employee != null && src.Employee.Position != null && src.Employee.Position.Department != null ? src.Employee.Position.Department.Name : null))
                .ForCtorParam(nameof(GetByDateResponse.Position), opt => opt.MapFrom(src => src.Position))
                .ForCtorParam(nameof(GetByDateResponse.Round), opt => opt.MapFrom(src => src.Round))
                .ForCtorParam(nameof(GetByDateResponse.Status), opt => opt.MapFrom(src => src.Status))
                .ForCtorParam(nameof(GetByDateResponse.AvailabilityStatus), opt => opt.MapFrom(src => src.AvailabilityStatus))
                .ForCtorParam(nameof(GetByDateResponse.QueueDate), opt => opt.MapFrom(src => src.QueueDate))
                .ForCtorParam(nameof(GetByDateResponse.UpdatedDate), opt => opt.MapFrom(src => src.UpdatedDate));
        }
    }
}

