using employee_management.Application.Common.Helpers;
using employee_management.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace employee_management.Application.Tests.Common.Helpers
{
    public class SalesAmountHelperTests
    {
        [Fact]
        public void ResolveSaleAmount_PrefersFirstClassSaleValue_OverDescription()
        {
            var report = new JobReport { SaleValue = 3200m, Description = "ปรับยอดอีกครั้ง" };

            SalesAmountHelper.ResolveSaleAmount(report).Should().Be(3200m);
        }

        [Fact]
        public void ResolveSaleAmount_FallsBackToDescription_WhenSaleValueIsNull()
        {
            var report = new JobReport { SaleValue = null, Description = "5000 | ลูกค้าใหม่" };

            SalesAmountHelper.ResolveSaleAmount(report).Should().Be(5000m);
        }

        [Fact]
        public void ResolveSaleAmount_ReturnsExplicitZero_WhenSaleValueIsZero()
        {
            // A report that was explicitly saved with a zero sale value stays zero.
            var report = new JobReport { SaleValue = 0m, Description = "gfdgdfgdf" };

            SalesAmountHelper.ResolveSaleAmount(report).Should().Be(0m);
        }

        [Fact]
        public void ResolveSaleAmount_ReturnsZero_WhenReportIsNull()
        {
            SalesAmountHelper.ResolveSaleAmount(null).Should().Be(0m);
        }

        [Theory]
        [InlineData("5000", 5000)]        // pure number
        [InlineData("5000 | note", 5000)] // "amount | notes" legacy packing
        [InlineData("not-a-number", 0)]
        [InlineData("", 0)]
        public void ExtractSalesAmount_ParsesLegacyDescriptionFormats(string description, decimal expected)
        {
            SalesAmountHelper.ExtractSalesAmount(description).Should().Be(expected);
        }
    }
}
