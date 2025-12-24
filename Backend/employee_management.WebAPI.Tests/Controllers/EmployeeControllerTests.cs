using employee_management.WebAPI.Controllers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace employee_management.WebAPI.Tests.Controllers
{
    public class EmployeeControllerTests
    {
        private readonly Mock<IMediator> _mediatorMock;
        private readonly EmployeeController _controller;

        public EmployeeControllerTests()
        {
            _mediatorMock = new Mock<IMediator>();
            _controller = new EmployeeController(_mediatorMock.Object);
        }

        [Fact]
        public void Constructor_ShouldInitializeController()
        {
            // Assert
            _controller.Should().NotBeNull();
        }
    }
}

