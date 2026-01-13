using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Enums;
using employee_management.Application.Features.EmployeeStatusAudit.Models;

namespace employee_management.Application.Features.EmployeeStatusAudit.Queries.GetEmployeeDailyAudit
{
    public sealed class GetEmployeeDailyAuditHandler : IRequestHandler<GetEmployeeDailyAuditRequest, EmployeeDailyAuditResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmployeeStatusHistoryRepository _historyRepository;
        private readonly IOptions<EmployeeStatusAuditOptions> _options;
        private readonly ILogger<GetEmployeeDailyAuditHandler> _logger;

        private static readonly TimeZoneInfo BangkokTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok");

        public GetEmployeeDailyAuditHandler(
            IEmployeeRepository employeeRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            IOptions<EmployeeStatusAuditOptions> options,
            ILogger<GetEmployeeDailyAuditHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _historyRepository = historyRepository;
            _options = options;
            _logger = logger;
        }

        public async Task<EmployeeDailyAuditResponse> Handle(GetEmployeeDailyAuditRequest request, CancellationToken cancellationToken)
        {
            var date = request.Date.Date;
            var (dayStartUtc, dayEndUtc) = GetBangkokDayRangeUtc(date);

            var employee = await _employeeRepository.Get(request.EmployeeId, cancellationToken);
            if (employee == null || employee.IsDeleted)
            {
                throw new employee_management.Application.Common.Exceptions.NoDataFoundException("Employee not found");
            }

            var dayEvents = await _historyRepository.GetAuditRangeAsync(
                start: dayStartUtc,
                end: dayEndUtc,
                employeeId: request.EmployeeId,
                actorType: request.ActorType,
                statuses: request.Statuses,
                cancellationToken: cancellationToken);

            var seed = await _historyRepository.GetLatestBeforeAsync(request.EmployeeId, dayStartUtc, cancellationToken);
            var segments = BuildSegments(dayStartUtc, dayEndUtc, seed, dayEvents);

            var timeline = BuildTimelineEvents(dayStartUtc, dayEndUtc, dayEvents);

            var (readyMin, breakMin, notReadyMin, offDutyMin) = SumBuckets(segments);
            var changeCount = timeline.Count;
            var currentStatus = segments.Count == 0 ? AvailabilityStatus.Unavailable : segments[^1].Status;

            var flags = ComputeAnomalies(date, segments, changeCount);
            if (request.OnlyAnomaly && flags.Count == 0)
            {
                // Return minimal payload with "ปกติ" but empty timeline
                return new EmployeeDailyAuditResponse(
                    EmployeeId: employee.Id,
                    EmployeeName: employee.Name,
                    Date: date,
                    ReadyMinutes: readyMin,
                    BreakMinutes: breakMin,
                    NotReadyMinutes: notReadyMin,
                    OffDutyMinutes: offDutyMin,
                    ChangeCount: changeCount,
                    CurrentStatus: currentStatus,
                    AnomalyFlags: flags,
                    Insight: "ปกติ",
                    MiniDayBar: segments,
                    Timeline: timeline);
            }

            var insight = flags.Count == 0
                ? "ปกติ"
                : $"พบความผิดปกติ: {string.Join(", ", flags)}";

            return new EmployeeDailyAuditResponse(
                EmployeeId: employee.Id,
                EmployeeName: employee.Name,
                Date: date,
                ReadyMinutes: readyMin,
                BreakMinutes: breakMin,
                NotReadyMinutes: notReadyMin,
                OffDutyMinutes: offDutyMin,
                ChangeCount: changeCount,
                CurrentStatus: currentStatus,
                AnomalyFlags: flags,
                Insight: insight,
                MiniDayBar: segments,
                Timeline: timeline);
        }

        private static (DateTimeOffset StartUtc, DateTimeOffset EndUtc) GetBangkokDayRangeUtc(DateTime bangkokDate)
        {
            var startLocal = new DateTime(bangkokDate.Year, bangkokDate.Month, bangkokDate.Day, 0, 0, 0, DateTimeKind.Unspecified);
            var endLocal = startLocal.AddDays(1);
            var startUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(startLocal, BangkokTimeZone));
            var endUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(endLocal, BangkokTimeZone));
            return (startUtc, endUtc);
        }

        private static List<TimelineSegmentDto> BuildSegments(
            DateTimeOffset dayStartUtc,
            DateTimeOffset dayEndUtc,
            employee_management.Domain.Entities.EmployeeStatusHistory? seed,
            List<employee_management.Domain.Entities.EmployeeStatusHistory> dayEvents)
        {
            var points = new List<(AvailabilityStatus status, DateTimeOffset at)>();
            if (seed != null)
            {
                points.Add((seed.NewStatus, dayStartUtc));
            }
            else if (dayEvents.Count > 0 && dayEvents[0].PreviousStatus.HasValue)
            {
                points.Add((dayEvents[0].PreviousStatus.Value, dayStartUtc));
            }
            else
            {
                points.Add((AvailabilityStatus.Unavailable, dayStartUtc));
            }

            foreach (var e in dayEvents.OrderBy(e => e.ChangedDate))
            {
                if (e.ChangedDate < dayStartUtc || e.ChangedDate >= dayEndUtc) continue;
                if (points.Count > 0 && points[^1].status == e.NewStatus) continue;
                points.Add((e.NewStatus, e.ChangedDate));
            }

            var segments = new List<TimelineSegmentDto>();
            for (var i = 0; i < points.Count; i++)
            {
                var start = points[i].at;
                var end = i + 1 < points.Count ? points[i + 1].at : (DateTimeOffset?)null;
                var effectiveEnd = end ?? DateTimeOffset.UtcNow;
                if (effectiveEnd > dayEndUtc) effectiveEnd = dayEndUtc;
                if (effectiveEnd < start) effectiveEnd = start;
                var duration = (int)Math.Round((effectiveEnd - start).TotalMinutes);
                var isRunning = end == null && DateTimeOffset.UtcNow < dayEndUtc;
                segments.Add(new TimelineSegmentDto(start, end, points[i].status, Math.Max(0, duration), isRunning));
            }

            return segments;
        }

        private static List<TimelineEventDto> BuildTimelineEvents(
            DateTimeOffset dayStartUtc,
            DateTimeOffset dayEndUtc,
            List<employee_management.Domain.Entities.EmployeeStatusHistory> dayEvents)
        {
            var ordered = dayEvents.OrderBy(e => e.ChangedDate).ToList();
            var timeline = new List<TimelineEventDto>();

            for (var i = 0; i < ordered.Count; i++)
            {
                var e = ordered[i];
                if (e.ChangedDate < dayStartUtc || e.ChangedDate >= dayEndUtc) continue;

                // de-dup consecutive same toStatus
                if (timeline.Count > 0 && timeline[^1].ToStatus == e.NewStatus) continue;

                var nextAt = ordered.Skip(i + 1).Select(x => x.ChangedDate).FirstOrDefault();
                DateTimeOffset? end = null;
                for (var j = i + 1; j < ordered.Count; j++)
                {
                    if (ordered[j].NewStatus != e.NewStatus)
                    {
                        end = ordered[j].ChangedDate;
                        break;
                    }
                }

                var effectiveEnd = end ?? DateTimeOffset.UtcNow;
                if (effectiveEnd > dayEndUtc) effectiveEnd = dayEndUtc;
                if (effectiveEnd < e.ChangedDate) effectiveEnd = e.ChangedDate;
                var duration = (int)Math.Round((effectiveEnd - e.ChangedDate).TotalMinutes);
                var isRunning = end == null && DateTimeOffset.UtcNow < dayEndUtc;

                timeline.Add(new TimelineEventDto(
                    Id: e.Id,
                    OccurredAt: e.ChangedDate,
                    FromStatus: e.PreviousStatus,
                    ToStatus: e.NewStatus,
                    DurationMinutes: Math.Max(0, duration),
                    IsRunning: isRunning,
                    ActorType: e.ActorType,
                    Source: e.Source,
                    Reason: e.Notes));
            }

            return timeline;
        }

        private static (int ready, int brk, int notReady, int offDuty) SumBuckets(List<TimelineSegmentDto> segments)
        {
            int ready = 0, brk = 0, notReady = 0, offDuty = 0;
            foreach (var s in segments)
            {
                if (s.Status == AvailabilityStatus.Available || s.Status == AvailabilityStatus.Busy) ready += s.DurationMinutes;
                else if (s.Status == AvailabilityStatus.LunchBreak) brk += s.DurationMinutes;
                else if (s.Status == AvailabilityStatus.Unavailable) notReady += s.DurationMinutes;
                else if (s.Status == AvailabilityStatus.Leave || s.Status == AvailabilityStatus.OffsiteCustomer) offDuty += s.DurationMinutes;
            }
            return (ready, brk, notReady, offDuty);
        }

        private IReadOnlyList<string> ComputeAnomalies(DateTime bangkokDate, List<TimelineSegmentDto> timeline, int changeCount)
        {
            var flags = new List<string>();
            var opt = _options.Value;

            if (changeCount > opt.FrequentChangesThreshold) flags.Add("FREQUENT_CHANGES");

            var breakTotal = timeline.Where(t => t.Status == AvailabilityStatus.LunchBreak).Sum(t => t.DurationMinutes);
            if (breakTotal > opt.LongBreakMinutesThreshold) flags.Add("LONG_BREAK");

            if (TimeSpan.TryParse(opt.WorkdayStartTime, out var startTime))
            {
                var startLocal = new DateTime(bangkokDate.Year, bangkokDate.Month, bangkokDate.Day, 0, 0, 0, DateTimeKind.Unspecified)
                    .Add(startTime);
                var startUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(startLocal, BangkokTimeZone));

                var firstReady = timeline.FirstOrDefault(t => t.Status == AvailabilityStatus.Available)?.Start;
                if (firstReady.HasValue && firstReady.Value > startUtc) flags.Add("LATE_READY");
            }

            return flags;
        }
    }
}

