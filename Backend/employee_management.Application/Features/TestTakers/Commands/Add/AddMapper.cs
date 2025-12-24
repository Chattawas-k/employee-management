using AutoMapper;
using employee_management.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace employee_management.Application.Features.TestTakers.Commands.Add
{
    public sealed class AddMapper : Profile
    {
        public AddMapper()
        {
            CreateMap<AddTestTakerRequest, TestTaker>();
            CreateMap<TestTaker, AddTestTakerResponse>();
        }
    }
}