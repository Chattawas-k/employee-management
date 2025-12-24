namespace employee_management.Application.Common.Models
{
    public abstract record BasePaginationRequest
    {
        private const int MaxPageSize = 50;
        private int _pageSize = 10;
        public int PageNumber { get; set; } = 1;
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }
        public string? SortBy { get; set; }
        public string? SortDirection { get; set; } // "asc" or "desc"
    }
}
