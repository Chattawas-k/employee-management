using System.Text.Json;
using MediatR;
using employee_management.Application.Repository.JobReportHistoriesRepository;
using employee_management.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace employee_management.Application.Features.Jobs.Queries.GetReportHistory
{
    public sealed class GetReportHistoryHandler : IRequestHandler<GetReportHistoryRequest, GetReportHistoryResponse>
    {
        private readonly IJobReportHistoryRepository _jobReportHistoryRepository;
        private readonly ILogger<GetReportHistoryHandler> _logger;

        public GetReportHistoryHandler(
            IJobReportHistoryRepository jobReportHistoryRepository,
            ILogger<GetReportHistoryHandler> logger)
        {
            _jobReportHistoryRepository = jobReportHistoryRepository;
            _logger = logger;
        }

        public async Task<GetReportHistoryResponse> Handle(GetReportHistoryRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var rows = await _jobReportHistoryRepository.GetByJobIdAsync(request.JobId, cancellationToken);

                var versions = new List<ReportHistoryDto>();
                var versionNumber = 0;

                foreach (var row in rows)
                {
                    versionNumber++;
                    var snapshot = DeserializeSnapshot(row.SnapshotJson);
                    var changedFields = DeserializeStringList(row.ChangedFieldsJson);

                    versions.Add(new ReportHistoryDto(
                        row.Id,
                        row.JobId,
                        versionNumber,
                        row.IsOriginal,
                        changedFields,
                        row.EditedByEmployeeId,
                        row.EditedByName,
                        row.EditedDate,
                        row.EditNote,
                        new ReportHistorySnapshotDto(
                            snapshot.CustomerName,
                            snapshot.CustomerContact,
                            snapshot.SalesStatus,
                            snapshot.JobStatus,
                            snapshot.Reasons,
                            snapshot.ProductCategory,
                            snapshot.Description,
                            snapshot.SaleValue,
                            snapshot.SaleDate
                        )
                    ));
                }

                return new GetReportHistoryResponse(versions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving report history for job {JobId}", request.JobId);
                throw;
            }
        }

        private static JobReportSnapshot DeserializeSnapshot(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new JobReportSnapshot();
            }

            try
            {
                return JsonSerializer.Deserialize<JobReportSnapshot>(json) ?? new JobReportSnapshot();
            }
            catch
            {
                return new JobReportSnapshot();
            }
        }

        private static List<string> DeserializeStringList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<string>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }
}
