using MediatR;
using employee_management.Application.Repository.AuditLogsRepository;

namespace employee_management.Application.Features.Manager.Queries.Audit.GetAuditLog
{
    public sealed class GetAuditLogHandler : IRequestHandler<GetAuditLogRequest, GetAuditLogResponse>
    {
        private readonly IAuditLogRepository _auditLogRepository;

        public GetAuditLogHandler(IAuditLogRepository auditLogRepository)
        {
            _auditLogRepository = auditLogRepository;
        }

        public async Task<GetAuditLogResponse> Handle(GetAuditLogRequest request, CancellationToken cancellationToken)
        {
            var logs = await _auditLogRepository.SearchAsync(
                request.ActorId,
                request.ActionType,
                request.EntityType,
                request.EntityId,
                request.DateFrom,
                request.DateTo,
                request.PageNumber,
                request.PageSize,
                cancellationToken);

            var logDtos = logs.Select(log => new AuditLogDto(
                log.Id,
                log.ActorId,
                log.ActorName,
                log.ActionType,
                log.EntityType,
                log.EntityId,
                log.BeforeJson,
                log.AfterJson,
                log.Reason,
                log.Timestamp,
                log.IpAddress
            )).ToList();

            // Get total count (simplified - would need separate count query)
            var totalCount = logDtos.Count;

            return new GetAuditLogResponse(logDtos, totalCount, request.PageNumber, request.PageSize);
        }
    }
}
