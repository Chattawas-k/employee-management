using System.Text.RegularExpressions;

namespace employee_management.Application.Common.Helpers
{
    public static class SalesAmountHelper
    {
        /// <summary>
        /// Extracts sales amount from Description field.
        /// Description may contain: "5000" or "5000 | additional info" or "5000, info" or "ยอด 5000 บาท" etc.
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
            var separators = new[] { '|', ',', '\n', '\r', ';' };
            var parts = desc.Split(separators, StringSplitOptions.RemoveEmptyEntries);
            
            if (parts.Length > 0)
            {
                var firstPart = parts[0].Trim();
                if (decimal.TryParse(firstPart, out amount))
                {
                    return amount;
                }
            }

            // Try to extract number from text using regex (e.g., "ยอด 5000 บาท", "ราคา 5000", "5000 บาท")
            // Look for numbers that might be amounts (typically larger numbers, could be with commas)
            var numberPattern = @"\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?";
            var matches = Regex.Matches(desc, numberPattern);
            
            foreach (Match match in matches)
            {
                var numberStr = match.Value.Replace(",", "").Replace(" ", "");
                if (decimal.TryParse(numberStr, out amount) && amount > 0)
                {
                    // Prefer larger numbers as they're more likely to be sales amounts
                    // But also check if it's a reasonable amount (not too small like 0.01)
                    if (amount >= 1)
                    {
                        return amount;
                    }
                }
            }

            return 0m;
        }
    }
}
