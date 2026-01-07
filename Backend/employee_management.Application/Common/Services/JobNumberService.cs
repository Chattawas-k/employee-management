using employee_management.Application.Repository.JobsRepository;

namespace employee_management.Application.Common.Services
{
    public sealed class JobNumberService : IJobNumberService
    {
        private readonly IJobRepository _jobRepository;

        public JobNumberService(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        public async Task<string> GenerateJobNumberAsync(DateTime date, CancellationToken cancellationToken)
        {
            // Count existing jobs created on the same date
            var count = await _jobRepository.CountJobsByDateAsync(date, cancellationToken);
            
            // Running number = count + 1
            var runningNumber = count + 1;

            // Format: YYMMDDNNNN
            // YY = ปี 2 หลัก (26 = 2026)
            // MM = เดือน 2 หลัก (01-12)
            // DD = วัน 2 หลัก (01-31)
            // NNNN = running number 4 หลัก (0001, 0002, ...)
            var year = date.Year % 100; // Get last 2 digits of year
            var month = date.Month;
            var day = date.Day;

            var jobNumber = $"{year:D2}{month:D2}{day:D2}{runningNumber:D4}";

            return jobNumber;
        }
    }
}


