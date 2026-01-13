import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DateRangeYmd = { startYmd: string; endYmd: string };

type CalendarDay = {
  date: Date;
  ymd: string;
  inMonth: boolean;
};

@Component({
  selector: 'app-date-range-picker-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-picker-dialog.component.html',
  styleUrls: ['./date-range-picker-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangePickerDialogComponent {
  @Input() startYmd!: string;
  @Input() endYmd!: string;
  @Input() isSubmitting: boolean = false;

  @Output() apply = new EventEmitter<DateRangeYmd>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private today = new Date();

  selectedStartYmd = signal<string>('');
  selectedEndYmd = signal<string>('');

  // Month being displayed (first day of month)
  viewMonth = signal<Date>(new Date(this.today.getFullYear(), this.today.getMonth(), 1));

  rangeLabel = computed(() => {
    const s = this.selectedStartYmd();
    const e = this.selectedEndYmd();
    if (!s || !e) return '';
    const fmt = new Intl.DateTimeFormat('th-TH-u-ca-gregory-nu-latn', { month: 'short', day: 'numeric', year: 'numeric' });
    const sd = new Date(`${s}T00:00:00`);
    const ed = new Date(`${e}T00:00:00`);
    return s === e ? fmt.format(sd) : `${fmt.format(sd)} - ${fmt.format(ed)}`;
  });

  monthTitle = computed(() => {
    const d = this.viewMonth();
    const fmt = new Intl.DateTimeFormat('th-TH-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });
    return fmt.format(d);
  });

  weeks = computed(() => {
    const month = this.viewMonth();
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const last = new Date(year, m + 1, 0);

    // Start from Sunday of the first week
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    // End at Saturday of the last week
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - last.getDay()));

    const days: CalendarDay[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const ymd = this.toYmd(cursor);
      days.push({
        date: new Date(cursor),
        ymd,
        inMonth: cursor.getMonth() === m
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  });

  ngOnInit(): void {
    // Initialize selection
    this.selectedStartYmd.set(this.startYmd);
    this.selectedEndYmd.set(this.endYmd);

    // Initialize month view to start month
    const start = this.startYmd ? new Date(`${this.startYmd}T00:00:00`) : new Date();
    this.viewMonth.set(new Date(start.getFullYear(), start.getMonth(), 1));
  }

  prevMonth(): void {
    const d = this.viewMonth();
    this.viewMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewMonth();
    this.viewMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectPreset(days: 1 | 7 | 30): void {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    this.selectedStartYmd.set(this.toYmd(start));
    this.selectedEndYmd.set(this.toYmd(end));
    this.viewMonth.set(new Date(start.getFullYear(), start.getMonth(), 1));
  }

  onDayClick(day: CalendarDay): void {
    if (this.isSubmitting) return;
    const clicked = day.ymd;
    const start = this.selectedStartYmd();
    const end = this.selectedEndYmd();

    // If no range yet, start a new one (single day)
    if (!start || !end) {
      this.selectedStartYmd.set(clicked);
      this.selectedEndYmd.set(clicked);
      return;
    }

    // Start a new range if clicked within current range (or reset behavior)
    // If user clicks again, treat it as choosing a new end around existing start.
    const newStart = start;
    if (clicked < newStart) {
      // swap so end >= start
      this.selectedStartYmd.set(clicked);
      this.selectedEndYmd.set(newStart);
    } else {
      this.selectedStartYmd.set(newStart);
      this.selectedEndYmd.set(clicked);
    }
  }

  isInRange(ymd: string): boolean {
    const s = this.selectedStartYmd();
    const e = this.selectedEndYmd();
    if (!s || !e) return false;
    return ymd >= s && ymd <= e;
  }

  isRangeStart(ymd: string): boolean {
    return this.selectedStartYmd() === ymd;
  }

  isRangeEnd(ymd: string): boolean {
    return this.selectedEndYmd() === ymd;
  }

  dayLabel(day: CalendarDay): string {
    return String(day.date.getDate());
  }

  onBackdropClick(): void {
    if (this.isSubmitting) return;
    this.close.emit();
  }

  onCancel(): void {
    if (this.isSubmitting) return;
    this.cancel.emit();
  }

  onApply(): void {
    if (this.isSubmitting) return;
    const start = this.selectedStartYmd();
    const end = this.selectedEndYmd();
    if (!start || !end) return;
    // guarantee end >= start
    const safeStart = start <= end ? start : end;
    const safeEnd = start <= end ? end : start;
    this.apply.emit({ startYmd: safeStart, endYmd: safeEnd });
  }

  private toYmd(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

