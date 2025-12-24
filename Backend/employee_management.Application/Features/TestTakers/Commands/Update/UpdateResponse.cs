namespace employee_management.Application.Features.TestTakers.Commands.Update
{
    public sealed record UpdateTestTakerResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FormNumber { get; set; }
        public string BannerID { get; set; }
        public DateTimeOffset DateUpdated { get; set; }
    }
}
