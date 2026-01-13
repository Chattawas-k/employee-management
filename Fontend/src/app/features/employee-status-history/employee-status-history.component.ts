import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { EmployeeStatusHistoryService } from '../../services/employee-status-history.service';
import { ToastService } from '../../services/toast.service';
import { ChangeReason, EmployeeStatusHistoryDto } from '../../models/employee.model';
import { getAvailabilityStatusBadgeClass, getAvailabilityStatusLabel, normalizeAvailabilityStatus } from '../../shared/utils/availability-status.util';

type ReasonFilter = 'all' | 'manual' | 'auto';

@Component({
  selector: 'app-employee-status-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-status-history.component.html',
  styleUrls: ['./employee-status-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeStatusHistoryComponent implements OnInit {
  private historyService = inject(EmployeeStatusHistoryService);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  histories = signal<EmployeeStatusHistoryDto[]>([]);

  startDate = signal<string>(''); // yyyy-mm-dd
  endDate = signal<string>('');   // yyyy-mm-dd
  reasonFilter = signal<ReasonFilter>('all');
  searchTerm = signal<string>('');

  filteredHistories = computed(() => {
    const list = this.histories() ?? [];
    const term = (this.searchTerm() ?? '').trim().toLowerCase();
    if (!term) return list;
    return list.filter(h => (h.employeeName ?? '').toLowerCase().includes(term));
  });

  hasData = computed(() => (this.filteredHistories() ?? []).length > 0);

  ngOnInit(): void {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.startDate.set(this.toDateInputValue(start));
    this.endDate.set(this.toDateInputValue(end));
    this.load();
  }

  load(): void {
    const startIso = this.startDate() ? new Date(this.startDate() + 'T00:00:00').toISOString() : undefined;
    const endIso = this.endDate() ? new Date(this.endDate() + 'T23:59:59').toISOString() : undefined;

    const changeReason = this.reasonFilter() === 'all'
      ? undefined
      : this.reasonFilter() === 'auto'
        ? ChangeReason.Auto
        : ChangeReason.Manual;

    this.isLoading.set(true);
    this.historyService.getHistory(undefined, startIso ? new Date(startIso) : undefined, endIso ? new Date(endIso) : undefined, changeReason).pipe(
      catchError(err => {
        console.error('Error loading employee status history', err);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดประวัติสถานะพนักงาน');
        return of({ histories: [] as EmployeeStatusHistoryDto[] });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(res => {
      this.histories.set(res?.histories ?? []);
    });
  }

  getReasonLabel(reason: ChangeReason | number | null | undefined): string {
    const value = typeof reason === 'number' ? reason : Number(reason);
    switch (value) {
      case ChangeReason.Auto: return 'อัตโนมัติ';
      case ChangeReason.Manual: return 'อัปเดตด้วยตัวเอง';
      default: return 'ไม่ทราบ';
    }
  }

  getStatusLabel(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return getAvailabilityStatusLabel(normalizeAvailabilityStatus(value));
  }

  getStatusBadgeClass(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return 'bg-slate-100 text-slate-700 border-slate-200';
    return getAvailabilityStatusBadgeClass(normalizeAvailabilityStatus(value));
  }

  formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private toDateInputValue(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

