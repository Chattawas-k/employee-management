using employee_management.Application.Common.Models;
using employee_management.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace employee_management.Application.Repository.TestTakersRepository
{
    public interface ITestTakerRepository : IBaseRepository<TestTaker>
    {
        Task<TestTaker> Get(string BannerID, CancellationToken cancellationToken);
        Task<PaginatedList<TestTaker>> SearchAsync(string? keyword, int pageNumber, int pageSize, string? sortBy, string? sortDirection, CancellationToken cancellationToken);
    }
}
