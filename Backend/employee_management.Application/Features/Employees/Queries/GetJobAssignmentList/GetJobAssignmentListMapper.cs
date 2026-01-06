// This mapper is not needed since we're calculating everything in the handler
// Keeping file for consistency with other features, but it won't be used
using AutoMapper;

namespace employee_management.Application.Features.Employees.Queries.GetJobAssignmentList
{
    public sealed class GetJobAssignmentListMapper : Profile
    {
        public GetJobAssignmentListMapper()
        {
            // Mapping is done manually in the handler to include job counts
            // This profile is kept for consistency with other features
        }
    }
}

