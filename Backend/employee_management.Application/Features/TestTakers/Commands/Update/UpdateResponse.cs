namespace employee_management.Application.Features.TestTakers.Commands.Update
{
    public sealed record UpdateTestTakerResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FormNumber { get; set; } = string.Empty;
        public string BannerID { get; set; } = string.Empty;
        public DateTimeOffset DateUpdated { get; set; }
    }
}
