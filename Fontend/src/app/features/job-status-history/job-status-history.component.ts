import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { ToastService } from '../../services/toast.service';
import { JobStatusHistoryService } from '../../services/job-status-history.service';
import { JobChangeSource, JobStatusHistoryDto } from '../../models/job-status-history.model';
import { JobStatus } from '../../models/task.model';

type SourceFilter = 'all' | 'auto' | 'manual' | 'assigned';

@Component({
  selector: 'app-job-status-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-status-history.component.html',
  styleUrls: ['./job-status-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobStatusHistoryComponent implements OnInit {
  private historyService = inject(JobStatusHistoryService);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  histories = signal<JobStatusHistoryDto[]>([]);

  startDate = signal<string>(''); // yyyy-mm-dd
  endDate = signal<string>('');   // yyyy-mm-dd
  sourceFilter = signal<SourceFilter>('all');

  hasData = computed(() => (this.histories() ?? []).length > 0);

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

    const source = this.mapSourceFilterToEnum(this.sourceFilter());

    this.isLoading.set(true);
    this.historyService.getMyJobStatusHistory({
      startDate: startIso,
      endDate: endIso,
      source,
      skip: 0,
      take: 100
    }).pipe(
      catchError(err => {
        console.error('Error loading job status history', err);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดประวัติสถานะงาน');
        return of({ histories: [] as JobStatusHistoryDto[] });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(res => {
      this.histories.set(res?.histories ?? []);
    });
  }

  getStatusLabel(status: JobStatus | string | null | undefined): string {
    if (status === null || status === undefined) return '-';

    const normalized = this.normalizeEnumLike(status);
    switch (normalized) {
      case 'pending': return 'รอดำเนินการ';
      case 'assigned': return 'มอบหมายแล้ว';
      case 'inprogress': return 'กำลังทำ';
      case 'closedwon': return 'ปิดงาน (สำเร็จ)';
      case 'closedlost': return 'ปิดงาน (ไม่สำเร็จ)';
      case 'cancelled': return 'ยกเลิก';
      default: return String(status);
    }
  }

  getSourceLabel(source: JobChangeSource | number | null | undefined): string {
    if (source === null || source === undefined) return 'ไม่ทราบ';
    const value = typeof source === 'number' ? source : Number(source);
    switch (value) {
      case JobChangeSource.Manual: return 'อัปเดตด้วยตัวเอง';
      case JobChangeSource.Auto: return 'อัตโนมัติ';
      case JobChangeSource.Assigned: return 'ถูกมอบหมาย';
      default: return 'ไม่ทราบ';
    }
  }

  formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private mapSourceFilterToEnum(filter: SourceFilter): JobChangeSource | undefined {
    switch (filter) {
      case 'auto': return JobChangeSource.Auto;
      case 'manual': return JobChangeSource.Manual;
      case 'assigned': return JobChangeSource.Assigned;
      default: return undefined;
    }
  }

  private normalizeEnumLike(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      switch (value) {
        case 1: return 'pending';
        case 2: return 'assigned';
        case 3: return 'inprogress';
        case 4: return 'closedwon';
        case 5: return 'closedlost';
        case 6: return 'cancelled';
        default: return String(value);
      }
    }
    return String(value).toLowerCase().replace(/[^a-z]/g, '');
  }

  private toDateInputValue(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

