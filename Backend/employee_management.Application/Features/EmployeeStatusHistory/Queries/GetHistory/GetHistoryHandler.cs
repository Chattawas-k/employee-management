using AutoMapper;
using MediatR;
using employee_management.Application.Repository;
using employee_management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.EmployeeStatusHistory.Queries.GetHistory
{
    public sealed class GetHistoryHandler : IRequestHandler<GetHistoryRequest, GetHistoryResponse>
    {
        private readonly IEmployeeStatusHistoryRepository _historyRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetHistoryHandler> _logger;

        public GetHistoryHandler(
            IEmployeeStatusHistoryRepository historyRepository,
            IMapper mapper,
            ILogger<GetHistoryHandler> logger)
        {
            _historyRepository = historyRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<GetHistoryResponse> Handle(GetHistoryRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var histories = await _historyRepository.GetFilteredAsync(
                    request.EmployeeId,
                    request.StartDate,
                    request.EndDate,
                    request.ChangeReason,
                    cancellationToken);

                var historyDtos = histories.Select(h => new EmployeeStatusHistoryDto(
                    h.Id,
                    h.EmployeeId,
                    h.Employee?.Name ?? "Unknown",
                    h.PreviousStatus,
                    h.NewStatus,
                    h.ChangeReason,
                    h.ChangedBy,
                    h.ChangedByEmployee?.Name,
                    h.ChangedDate,
                    h.Notes
                )).ToList();

                return new GetHistoryResponse(historyDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee status history");
                throw;
            }
        }
    }
}

