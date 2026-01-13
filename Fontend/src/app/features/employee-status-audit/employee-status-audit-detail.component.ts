import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { EmployeeStatusAuditService } from '../../services/employee-status-audit.service';
import { ToastService } from '../../services/toast.service';
import { EmployeeDailyAuditResponse, TimelineEventDto, TimelineSegmentDto } from '../../models/employee-status-audit.model';
import { getAvailabilityStatusBadgeClass, getAvailabilityStatusLabel, normalizeAvailabilityStatus } from '../../shared/utils/availability-status.util';

type ActorKey = 'all' | 'self' | 'admin' | 'system';

@Component({
  selector: 'app-employee-status-audit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './employee-status-audit-detail.component.html',
  styleUrls: ['./employee-status-audit-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeStatusAuditDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(EmployeeStatusAuditService);
  private toast = inject(ToastService);

  employeeId = signal<string>('');
  date = signal<string>(this.toDateInputValue(new Date()));

  actor = signal<ActorKey>('all');
  onlyAnomaly = signal<boolean>(false);
  selectedStatuses = signal<Set<number>>(new Set<number>());

  isLoading = signal(false);
  data = signal<EmployeeDailyAuditResponse | null>(null);

  miniBar = computed(() => this.data()?.miniDayBar ?? []);
  timeline = computed(() => this.data()?.timeline ?? []);
  summary = computed(() => ({
    ready: this.data()?.readyMinutes ?? 0,
    brk: this.data()?.breakMinutes ?? 0,
    changes: this.data()?.changeCount ?? 0,
  }));

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('employeeId');
    if (employeeId) this.employeeId.set(employeeId);

    const qpDate = this.route.snapshot.queryParamMap.get('date');
    if (qpDate) this.date.set(qpDate);

    this.load();
  }

  load(): void {
    if (!this.employeeId()) return;

    this.isLoading.set(true);
    this.api
      .getEmployeeDaily({
        employeeId: this.employeeId(),
        date: this.date(),
        actorType: this.actorToEnum(this.actor()),
        statuses: Array.from(this.selectedStatuses().values()),
        onlyAnomaly: this.onlyAnomaly(),
      })
      .pipe(
        catchError((err) => {
          console.error('employee status audit detail error', err);
          this.toast.error('เกิดข้อผิดพลาดในการโหลด Timeline');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((res) => this.data.set(res));
  }

  toggleStatus(statusEnum: number): void {
    const next = new Set(this.selectedStatuses());
    if (next.has(statusEnum)) next.delete(statusEnum);
    else next.add(statusEnum);
    this.selectedStatuses.set(next);
  }

  getStatusLabel(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return getAvailabilityStatusLabel(normalizeAvailabilityStatus(value));
  }

  getStatusBadgeClass(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return 'bg-slate-100 text-slate-700 border-slate-200';
    return getAvailabilityStatusBadgeClass(normalizeAvailabilityStatus(value));
  }

  formatTime(iso: string | null | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateThai(yyyyMmDd: string): string {
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return yyyyMmDd;
    return d.toLocaleDateString('th-TH', { dateStyle: 'full' });
  }

  minutesLabel(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h <= 0) return `${m} นาที`;
    if (m === 0) return `${h} ชม.`;
    return `${h} ชม. ${m} นาที`;
  }

  anomalyLabel(flag: string): string {
    switch (flag) {
      case 'FREQUENT_CHANGES':
        return 'เปลี่ยนถี่';
      case 'LONG_BREAK':
        return 'พักมาก';
      case 'LATE_READY':
        return 'มาสาย';
      default:
        return flag;
    }
  }

  actorLabel(value: any): string {
    const v = typeof value === 'number' ? value : String(value);
    if (v === 1 || v === 'Self') return 'SELF';
    if (v === 2 || v === 'Admin') return 'ADMIN';
    if (v === 3 || v === 'System') return 'SYSTEM';
    return 'UNKNOWN';
  }

  sourceLabel(value: any): string {
    const v = typeof value === 'number' ? value : String(value);
    if (v === 1 || v === 'Web') return 'WEB';
    if (v === 2 || v === 'Mobile') return 'MOBILE';
    if (v === 3 || v === 'Cron') return 'CRON';
    return 'UNKNOWN';
  }

  segmentWidth(seg: TimelineSegmentDto): string {
    // Approx for a day bar: use minutes within 24h. If running, still use durationMinutes returned by API.
    const total = 24 * 60;
    const pct = Math.max(0, Math.min(100, (seg.durationMinutes / total) * 100));
    return `${pct}%`;
  }

  scrollToTime(iso: string): void {
    const id = `evt-${iso.replace(/[:.]/g, '-')}`;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  eventDomId(e: TimelineEventDto): string {
    return `evt-${(e.occurredAt ?? '').replace(/[:.]/g, '-')}`;
  }

  private actorToEnum(key: ActorKey): number | undefined {
    switch (key) {
      case 'self':
        return 1;
      case 'admin':
        return 2;
      case 'system':
        return 3;
      default:
        return undefined;
    }
  }

  private toDateInputValue(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

