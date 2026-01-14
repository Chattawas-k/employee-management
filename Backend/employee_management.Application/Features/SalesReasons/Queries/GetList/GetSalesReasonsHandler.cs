using MediatR;
using employee_management.Application.Features.SalesReasons.Models;
using employee_management.Application.Repository.SalesReasonsRepository;

namespace employee_management.Application.Features.SalesReasons.Queries.GetList
{
    public sealed class GetSalesReasonsHandler : IRequestHandler<GetSalesReasonsRequest, GetSalesReasonsResponse>
    {
        private readonly ISalesReasonRepository _salesReasonRepository;

        public GetSalesReasonsHandler(ISalesReasonRepository salesReasonRepository)
        {
            _salesReasonRepository = salesReasonRepository;
        }

        public async Task<GetSalesReasonsResponse> Handle(GetSalesReasonsRequest request, CancellationToken cancellationToken)
        {
            var reasons = await _salesReasonRepository.GetByTypeAsync(request.Type, request.IncludeInactive, cancellationToken);

            var dtos = reasons
                .Select(r => new SalesReasonDto(
                    r.Id,
                    r.Type,
                    r.Label,
                    r.IsActive,
                    r.SortOrder))
                .ToList();

            return new GetSalesReasonsResponse(dtos);
        }
    }
}

