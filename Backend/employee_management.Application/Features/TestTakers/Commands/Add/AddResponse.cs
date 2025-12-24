using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace employee_management.Application.Features.TestTakers.Commands.Add
{
    public sealed record class AddTestTakerResponse
    {
        public Guid ID { get; set; }
        public string? BannerID { get; set; }
    }
}
