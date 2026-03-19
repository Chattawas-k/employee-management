using System;

namespace employee_management.Application.Features.TestTakers.Queries.Search
{
    public sealed record SearchTestTakerResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FormNumber { get; set; } = string.Empty;
        public string BannerID { get; set; } = string.Empty;
    }
}
