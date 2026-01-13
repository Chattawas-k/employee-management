import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { EmployeeStatusAuditService } from '../../services/employee-status-audit.service';
import { ToastService } from '../../services/toast.service';
import { DailyAuditEmployeeRowDto, DailyAuditListResponse } from '../../models/employee-status-audit.model';
import { getAvailabilityStatusBadgeClass, getAvailabilityStatusLabel, normalizeAvailabilityStatus } from '../../shared/utils/availability-status.util';

type SortKey = 'latest' | 'frequent' | 'break';
type ActorKey = 'all' | 'self' | 'admin' | 'system';

@Component({
  selector: 'app-employee-status-audit-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './employee-status-audit-list.component.html',
  styleUrls: ['./employee-status-audit-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeStatusAuditListComponent implements OnInit {
  private api = inject(EmployeeStatusAuditService);
  private toast = inject(ToastService);

  isLoading = signal(false);
  data = signal<DailyAuditListResponse | null>(null);

  date = signal<string>(this.toDateInputValue(new Date()));
  search = signal<string>('');

  // statuses are backend enum ints: 1..6
  selectedStatuses = signal<Set<number>>(new Set<number>());
  actor = signal<ActorKey>('all');
  anomalies = signal<Set<string>>(new Set<string>());
  sort = signal<SortKey>('latest');

  employees = computed(() => this.data()?.employees ?? []);
  summary = computed(() => this.data()?.summary ?? { totalEmployees: 0, readyNow: 0, anomalyCases: 0 });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);

    this.api
      .getDaily({
        date: this.date(),
        search: this.search().trim() || undefined,
        statuses: Array.from(this.selectedStatuses().values()),
        actorType: this.actorToEnum(this.actor()),
        anomalies: Array.from(this.anomalies().values()),
        sort: this.sort(),
      })
      .pipe(
        catchError((err) => {
          console.error('employee status audit daily error', err);
          this.toast.error('เกิดข้อผิดพลาดในการโหลดประวัติสถานะพนักงาน');
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

  toggleAnomaly(flag: string): void {
    const next = new Set(this.anomalies());
    if (next.has(flag)) next.delete(flag);
    else next.add(flag);
    this.anomalies.set(next);
  }

  clearFilters(): void {
    this.search.set('');
    this.selectedStatuses.set(new Set<number>());
    this.actor.set('all');
    this.anomalies.set(new Set<string>());
    this.sort.set('latest');
    this.load();
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

