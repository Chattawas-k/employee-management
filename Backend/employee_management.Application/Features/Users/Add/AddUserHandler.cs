using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace employee_management.Application.Features.Users.Add
{
    public sealed class AddUserHandler : IRequestHandler<AddUserRequest, AddUserResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly IMapper _mapper;

        public AddUserHandler(UserManager<User> userManager, RoleManager<Role> roleManager, IMapper mapper)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _mapper = mapper;
        }

        public async Task<AddUserResponse> Handle(AddUserRequest request, CancellationToken cancellationToken)
        {
            var user = new User
            {
                UserName = request.UserName,
                Email = request.Email
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                throw new System.Exception(string.Join("; ", result.Errors.Select(e => e.Description)));

            // Assign role if provided
            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                var roleExists = await _roleManager.RoleExistsAsync(request.Role);
                if (!roleExists)
                    await _roleManager.CreateAsync(new Role { Name = request.Role });

                await _userManager.AddToRoleAsync(user, request.Role);
            }

            return _mapper.Map<AddUserResponse>(user);
        }
    }
}