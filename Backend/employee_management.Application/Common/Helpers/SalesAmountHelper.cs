namespace employee_management.Application.Common.Helpers
{
    public static class SalesAmountHelper
    {
        /// <summary>
        /// Extracts sales amount from Description field.
        /// Description may contain: "5000" or "5000 | additional info" or "5000, info"
        /// </summary>
        public static decimal ExtractSalesAmount(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return 0m;

            var desc = description.Trim();
            
            // Try parsing the entire description first
            if (decimal.TryParse(desc, out var amount))
            {
                return amount;
            }

            // Try extracting number from format like "5000 | info" or "5000, info"
            var separators = new[] { '|', ',', '\n', '\r' };
            var parts = desc.Split(separators, StringSplitOptions.RemoveEmptyEntries);
            
            if (parts.Length > 0)
            {
                var firstPart = parts[0].Trim();
                if (decimal.TryParse(firstPart, out amount))
                {
                    return amount;
                }
            }

            return 0m;
        }
    }
}
