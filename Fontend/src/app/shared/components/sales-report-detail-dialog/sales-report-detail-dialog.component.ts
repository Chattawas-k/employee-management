import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesReport, ReportStatus } from '../../../models/sales-report.model';

@Component({
  selector: 'app-sales-report-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-report-detail-dialog.component.html',
  styleUrls: ['./sales-report-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReportDetailDialogComponent {
  @Input() report!: SalesReport;
  @Input() allowStatusUpdate: boolean = true; // Allow updating status (default true for staff, false for admin)
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
        return { text: 'ไม่ระบุ', class: 'bg-gray-100 ', icon: 'question-mark-circle' };
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
    return new Intl.NumberFormat('th-TH', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true 
    }).format(value) + ' บาท';
  }

  /**
   * Get sale value from report, extracting from notes/description if saleValue is not available
   */
  getSaleValue(): number | undefined {
    // If saleValue exists, use it (this should be set during mapping)
    if (this.report.saleValue !== undefined && this.report.saleValue !== null && this.report.saleValue > 0) {
      return this.report.saleValue;
    }

    // Fallback: try to extract from notes if saleValue is not set
    // This handles cases where mapping didn't extract the value
    const text = this.report.notes || '';
    if (!text) return undefined;

    // Try to extract number from text
    // Handle formats like: "65300", "65300 | info", "ยอด 65300 บาท"
    const trimmed = text.trim();
    
    // Try parsing the entire text first
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }

    // Try extracting from format like "5000 | info" or "5000, info"
    const separators = ['|', ',', '\n', '\r', ';'];
    for (const sep of separators) {
      const parts = trimmed.split(sep);
      if (parts.length > 0) {
        const firstPart = parts[0].trim();
        const num = parseFloat(firstPart);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
    }

    // Try extracting number from Thai text like "ยอด 5000 บาท" or any number pattern
    const numberPattern = /\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?/g;
    const matches = trimmed.match(numberPattern);
    
    if (matches && matches.length > 0) {
      // Find the largest number (most likely to be the sale amount)
      let maxAmount = 0;
      for (const match of matches) {
        const numStr = match.replace(/[,\s]/g, '');
        const num = parseFloat(numStr);
        if (!isNaN(num) && num > maxAmount && num >= 1) {
          maxAmount = num;
        }
      }
      if (maxAmount > 0) {
        return maxAmount;
      }
    }

    return undefined;
  }
}

