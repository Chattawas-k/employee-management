using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using employee_management.Application.Common.Services;
using employee_management.Application.Repository;
using employee_management.Application.Repository.EmployeesRepository;
using employee_management.Domain.Enums;
using employee_management.Application.Features.EmployeeStatusAudit.Models;

namespace employee_management.Application.Features.EmployeeStatusAudit.Queries.GetDailyAuditList
{
    public sealed class GetDailyAuditListHandler : IRequestHandler<GetDailyAuditListRequest, DailyAuditListResponse>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmployeeStatusHistoryRepository _historyRepository;
        private readonly IOptions<EmployeeStatusAuditOptions> _options;
        private readonly ILogger<GetDailyAuditListHandler> _logger;

        private static readonly TimeZoneInfo BangkokTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok");

        public GetDailyAuditListHandler(
            IEmployeeRepository employeeRepository,
            IEmployeeStatusHistoryRepository historyRepository,
            IOptions<EmployeeStatusAuditOptions> options,
            ILogger<GetDailyAuditListHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _historyRepository = historyRepository;
            _options = options;
            _logger = logger;
        }

        public async Task<DailyAuditListResponse> Handle(GetDailyAuditListRequest request, CancellationToken cancellationToken)
        {
            var date = request.Date.Date;
            var (dayStartUtc, dayEndUtc) = GetBangkokDayRangeUtc(date);

            var allEmployees = await _employeeRepository.GetAll(cancellationToken);
            var employees = allEmployees
                .Where(e => !e.IsDeleted && e.Status == EmployeeStatus.Active)
                .ToList();

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLowerInvariant();
                employees = employees
                    .Where(e => (e.Name ?? string.Empty).ToLowerInvariant().Contains(term))
                    .ToList();
            }

            var rows = new List<DailyAuditEmployeeRowDto>(employees.Count);
            foreach (var employee in employees)
            {
                var dayEvents = await _historyRepository.GetAuditRangeAsync(
                    start: dayStartUtc,
                    end: dayEndUtc,
                    employeeId: employee.Id,
                    actorType: request.ActorType,
                    statuses: request.Statuses,
                    cancellationToken: cancellationToken);

                // Seed with the last event before day start to compute durations correctly
                var seed = await _historyRepository.GetLatestBeforeAsync(employee.Id, dayStartUtc, cancellationToken);
                var timeline = BuildTimeline(dayStartUtc, dayEndUtc, seed, dayEvents);

                var (readyMin, breakMin, notReadyMin, offDutyMin) = SumBuckets(timeline);
                var changeCount = dayEvents
                    .OrderBy(e => e.ChangedDate)
                    .Aggregate(new List<(AvailabilityStatus status, DateTimeOffset at)>(), (acc, e) =>
                    {
                        if (acc.Count == 0 || acc[^1].status != e.NewStatus) acc.Add((e.NewStatus, e.ChangedDate));
                        return acc;
                    })
                    .Count;

                var currentStatus = timeline.Count == 0 ? AvailabilityStatus.Unavailable : timeline[^1].Status;
                var lastEvent = dayEvents.OrderByDescending(e => e.ChangedDate).FirstOrDefault();

                var flags = ComputeAnomalies(
                    date,
                    employeeId: employee.Id,
                    timeline: timeline,
                    changeCount: changeCount);

                if (request.Anomalies is { Count: > 0 })
                {
                    var wanted = new HashSet<string>(request.Anomalies, StringComparer.OrdinalIgnoreCase);
                    if (!flags.Any(f => wanted.Contains(f)))
                    {
                        continue;
                    }
                }

                rows.Add(new DailyAuditEmployeeRowDto(
                    EmployeeId: employee.Id,
                    EmployeeName: employee.Name,
                    CurrentStatus: currentStatus,
                    ReadyMinutes: readyMin,
                    BreakMinutes: breakMin,
                    NotReadyMinutes: notReadyMin,
                    OffDutyMinutes: offDutyMin,
                    ChangeCount: changeCount,
                    LastEventAt: lastEvent?.ChangedDate,
                    LastEventStatus: lastEvent?.NewStatus,
                    AnomalyFlags: flags));
            }

            rows = ApplySort(rows, request.Sort);

            var summary = new DailyAuditSummaryDto(
                TotalEmployees: rows.Count,
                ReadyNow: rows.Count(r => r.CurrentStatus == AvailabilityStatus.Available),
                AnomalyCases: rows.Count(r => r.AnomalyFlags.Count > 0));

            return new DailyAuditListResponse(date, summary, rows);
        }

        private static (DateTimeOffset StartUtc, DateTimeOffset EndUtc) GetBangkokDayRangeUtc(DateTime bangkokDate)
        {
            var startLocal = new DateTime(bangkokDate.Year, bangkokDate.Month, bangkokDate.Day, 0, 0, 0, DateTimeKind.Unspecified);
            var endLocal = startLocal.AddDays(1);
            var startUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(startLocal, BangkokTimeZone));
            var endUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(endLocal, BangkokTimeZone));
            return (startUtc, endUtc);
        }

        private static List<TimelineSegmentDto> BuildTimeline(
            DateTimeOffset dayStartUtc,
            DateTimeOffset dayEndUtc,
            employee_management.Domain.Entities.EmployeeStatusHistory? seed,
            List<employee_management.Domain.Entities.EmployeeStatusHistory> dayEvents)
        {
            var events = new List<(AvailabilityStatus status, DateTimeOffset at)>();

            if (seed != null)
            {
                events.Add((seed.NewStatus, dayStartUtc));
            }
            else if (dayEvents.Count > 0 && dayEvents[0].PreviousStatus.HasValue)
            {
                events.Add((dayEvents[0].PreviousStatus.Value, dayStartUtc));
            }
            else
            {
                events.Add((AvailabilityStatus.Unavailable, dayStartUtc));
            }

            foreach (var e in dayEvents.OrderBy(e => e.ChangedDate))
            {
                if (e.ChangedDate < dayStartUtc || e.ChangedDate >= dayEndUtc) continue;
                if (events.Count > 0 && events[^1].status == e.NewStatus) continue;
                events.Add((e.NewStatus, e.ChangedDate));
            }

            var segments = new List<TimelineSegmentDto>();
            for (var i = 0; i < events.Count; i++)
            {
                var start = events[i].at;
                var end = i + 1 < events.Count ? events[i + 1].at : (DateTimeOffset?)null;
                var effectiveEnd = end ?? DateTimeOffset.UtcNow;
                if (effectiveEnd > dayEndUtc) effectiveEnd = dayEndUtc;
                if (effectiveEnd < start) effectiveEnd = start;

                var duration = (int)Math.Round((effectiveEnd - start).TotalMinutes);
                var isRunning = end == null && DateTimeOffset.UtcNow < dayEndUtc;

                segments.Add(new TimelineSegmentDto(
                    Start: start,
                    End: end,
                    Status: events[i].status,
                    DurationMinutes: Math.Max(0, duration),
                    IsRunning: isRunning));
            }

            return segments;
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

        private IReadOnlyList<string> ComputeAnomalies(
            DateTime bangkokDate,
            Guid employeeId,
            List<TimelineSegmentDto> timeline,
            int changeCount)
        {
            var flags = new List<string>();
            var opt = _options.Value;

            if (changeCount > opt.FrequentChangesThreshold)
            {
                flags.Add("FREQUENT_CHANGES");
            }

            var breakTotal = timeline.Where(t => t.Status == AvailabilityStatus.LunchBreak).Sum(t => t.DurationMinutes);
            if (breakTotal > opt.LongBreakMinutesThreshold)
            {
                flags.Add("LONG_BREAK");
            }

            // LATE_READY: first time employee becomes Available after WorkdayStartTime (Bangkok)
            if (TimeSpan.TryParse(opt.WorkdayStartTime, out var startTime))
            {
                var startLocal = new DateTime(bangkokDate.Year, bangkokDate.Month, bangkokDate.Day, 0, 0, 0, DateTimeKind.Unspecified)
                    .Add(startTime);
                var startUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(startLocal, BangkokTimeZone));

                var firstReady = timeline.FirstOrDefault(t => t.Status == AvailabilityStatus.Available)?.Start;
                if (firstReady.HasValue && firstReady.Value > startUtc)
                {
                    flags.Add("LATE_READY");
                }
            }

            return flags;
        }

        private static List<DailyAuditEmployeeRowDto> ApplySort(List<DailyAuditEmployeeRowDto> rows, string? sort)
        {
            return (sort ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "frequent" => rows.OrderByDescending(r => r.ChangeCount).ThenBy(r => r.EmployeeName).ToList(),
                "break" => rows.OrderByDescending(r => r.BreakMinutes).ThenBy(r => r.EmployeeName).ToList(),
                _ => rows.OrderByDescending(r => r.LastEventAt ?? DateTimeOffset.MinValue).ThenBy(r => r.EmployeeName).ToList(),
            };
        }
    }
}

