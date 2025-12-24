namespace employee_management.Application.Common.Exceptions
{
    public class BadRequestException : Exception
    {
        public BadRequestException(string message) : base(message)
        {
            Errors = Array.Empty<string>(); // Initialize Errors to an empty array to satisfy non-nullable requirement.  
        }

        public BadRequestException(string[] errors) : base("Multiple errors occurred. See error details.")
        {
            Errors = errors ?? Array.Empty<string>(); // Ensure Errors is never null.  
        }

        public string[] Errors { get; set; }
    }
    public class NoDataFoundException : Exception
    {
        public NoDataFoundException(string message) : base(message)
        {
        }
    }
    public class SocketException : Exception
    {
        public SocketException(string message) : base(message)
        {
        }
    }
    public class UserAlreadyExistsException : Exception
    {
        public UserAlreadyExistsException() : base("User already exists.")
        {
        }
    }
}
