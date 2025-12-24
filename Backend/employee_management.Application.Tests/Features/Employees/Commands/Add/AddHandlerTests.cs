using AutoMapper;
using employee_management.Application.Features.Employees.Commands.Add;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Entities;
using employee_management.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace employee_management.Application.Tests.Features.Employees.Commands.Add
{
    public class AddHandlerTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IEmployeeRepository> _employeeRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<ILogger<AddHandler>> _loggerMock;
        private readonly AddHandler _handler;

        public AddHandlerTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _employeeRepositoryMock = new Mock<IEmployeeRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<AddHandler>>();
            _handler = new AddHandler(
                _unitOfWorkMock.Object,
                _employeeRepositoryMock.Object,
                _mapperMock.Object,
                _loggerMock.Object);
        }

        [Fact]
        public async Task Handle_ShouldCreateEmployee_WhenRequestIsValid()
        {
            // Arrange
            var request = new AddRequest
            {
                Name = "John Doe",
                Phone = "1234567890",
                Status = EmployeeStatus.Active,
                PositionId = Guid.NewGuid(),
                Avatar = "https://example.com/avatar.jpg"
            };

            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Phone = request.Phone,
                Status = request.Status,
                PositionId = request.PositionId,
                Avatar = request.Avatar
            };

            var response = new AddResponse
            {
                Id = employee.Id,
                Name = employee.Name
            };

            _mapperMock.Setup(m => m.Map<Employee>(request)).Returns(employee);
            _mapperMock.Setup(m => m.Map<AddResponse>(employee)).Returns(response);
            _unitOfWorkMock.Setup(u => u.Save(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

            // Act
            var result = await _handler.Handle(request, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(request.Name);
            _employeeRepositoryMock.Verify(r => r.Create(It.IsAny<Employee>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.Save(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}

