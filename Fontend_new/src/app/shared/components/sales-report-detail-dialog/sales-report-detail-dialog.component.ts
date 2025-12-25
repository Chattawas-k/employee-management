import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { SalesReport, ReportStatus } from '../../../models/sales-report.model';

@Component({
  selector: 'app-sales-report-detail-dialog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './sales-report-detail-dialog.component.html',
  styleUrls: ['./sales-report-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReportDetailDialogComponent {
  @Input() report!: SalesReport;
  @Output() close = new EventEmitter<void>();
  @Output() updateStatus = new EventEmitter<ReportStatus>();

  statusInfo = computed(() => {
    const status = this.report.status;
    switch (status) {
      case 'Success':
        return { text: 'สำเร็จ', class: 'bg-green-100 text-green-800', icon: 'check-circle' };
      case 'Pending':
        return { text: 'รอตัดสินใจ', class: 'bg-yellow-100 text-yellow-800', icon: 'clock' };
      case 'Failed':
        return { text: 'ไม่สำเร็จ', class: 'bg-red-100 text-red-800', icon: 'x-circle' };
      default:
        return { text: 'ไม่ระบุ', class: 'bg-gray-100 text-gray-800', icon: 'question-mark-circle' };
    }
  });

  recordDate = computed(() => {
    return this.report.status === 'Success' ? this.report.saleDate : this.report.submittedAt;
  });
  
  formatThaiDateTime(date?: Date): string {
    if (!date) return '-';
    const d = new Date(date);
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const thaiDate = new Intl.DateTimeFormat('th-TH', dateOptions).format(d);
    const thaiTime = new Intl.DateTimeFormat('th-TH', timeOptions).format(d);
    
    return `${thaiDate} ${thaiTime}`;
  }

  formatThaiDateLong(date?: Date): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  formatCurrency(value?: number): string {
    if (value === undefined || value === null) return '-';
    return 'THB ' + new Intl.NumberFormat('en-US', { useGrouping: true }).format(value);
  }
}

