using Microsoft.EntityFrameworkCore;
using employee_management.Application.Repository.TestTakersRepository;
using employee_management.Domain.Entities;
using employee_management.Persistence.Context;
using employee_management.Persistence.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using employee_management.Application.Common.Services;
using System.Linq.Dynamic.Core;
using employee_management.Application.Common.Models;

namespace employee_management.Persistence.Repository.TestTakersRepository
{
    public class TestTakerRepository : BaseRepository<TestTaker>, ITestTakerRepository
    {
        public TestTakerRepository(ApplicationDbContext context, ICurrentUserService currentUserService) : base(context, currentUserService)
        {
        }

        public async Task<TestTaker> Get(string BannerID, CancellationToken cancellationToken)
        {
            var testTaker = await Context.TestTakers.FirstOrDefaultAsync(x => x.BannerID == BannerID, cancellationToken);
            if (testTaker == null)
            {
                throw new InvalidOperationException($"TestTaker with BannerID '{BannerID}' not found.");
            }
            return testTaker;
        }

        public async Task<PaginatedList<TestTaker>> SearchAsync(string? keyword, int pageNumber, int pageSize, string? sortBy, string? sortDirection, CancellationToken cancellationToken)
        {
            IQueryable<TestTaker> query = Context.TestTakers;

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var lowerKeyword = keyword.ToLower();
                query = query.Where(t =>
                    (t.Email != null && t.Email.ToLower().Contains(lowerKeyword)) ||
                    (t.FirstName != null && t.FirstName.ToLower().Contains(lowerKeyword)) ||
                    (t.LastName != null && t.LastName.ToLower().Contains(lowerKeyword)) ||
                    (t.BannerID != null && t.BannerID.ToLower().Contains(lowerKeyword)) ||
                    (t.FormNumber != null && t.FormNumber.ToLower().Contains(lowerKeyword)));
            }

            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                var direction = sortDirection?.ToLower() == "desc" ? "descending" : "ascending";
                query = query.OrderBy($"{sortBy} {direction}");
            }
            else
            {
                query = query.OrderBy(t => t.CreatedDate);
            }

            return await PaginatedList<TestTaker>.CreateAsync(query, pageNumber, pageSize);
        }
    }
}
