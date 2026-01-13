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

        public async Task<JobNumberResult> GenerateJobNumberAsync(DateTime date, CancellationToken cancellationToken)
        {
            // Count existing jobs created on the same date
            var count = await _jobRepository.CountJobsByDateAsync(date, cancellationToken);
            
            // Running number = count + 1
            var runningNumber = count + 1;

            // Format: YYMMDD + running(min 3 digits, extend if >= 1000)
            // YY = ปี 2 หลัก (26 = 2026)
            // MM = เดือน 2 หลัก (01-12)
            // DD = วัน 2 หลัก (01-31)
            // running = 3 หลักขั้นต่ำ (001..999), และขยายเป็น 4+ หลักเมื่อเกิน 999 (1000..)
            var year = date.Year % 100; // Get last 2 digits of year
            var month = date.Month;
            var day = date.Day;

            var runningCode = runningNumber < 1000
                ? $"{runningNumber:D3}"
                : runningNumber.ToString();

            var jobNumber = $"{year:D2}{month:D2}{day:D2}{runningCode}";

            return new JobNumberResult(jobNumber, runningCode);
        }
    }
}


