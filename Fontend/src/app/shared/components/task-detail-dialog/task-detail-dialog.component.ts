import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../task-column/task-column.component';
import { ReportStatus } from '../../../models/sales-report.model';

interface HistoryEntry {
  key: string;
  title: string;
  timestamp?: string | null;
  description?: string;
  iconColor: string;
  iconBg: string;
  iconPath: string;
}

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail-dialog.component.html',
  styleUrls: ['./task-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskDetailDialogComponent implements OnChanges {
  @Input() task!: Task;
  @Output() close = new EventEmitter<void>();

  activeTab = signal<'details' | 'history'>('details');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task']) {
      // For Pending/In-progress/Rejected: show history only
      // For Completed: default to details
      this.activeTab.set(this.canShowDetails() ? 'details' : 'history');
    }
  }

  canShowDetails = computed(() => this.task?.status === 'completed');

  statusInfo = computed(() => {
    const status = this.task.status;
    switch (status) {
      case 'pending':
        return { text: 'รอดำเนินการ', class: 'text-blue-600 font-medium bg-blue-100', textColor: 'text-blue-600', iconColor: 'text-blue-600', iconBg: 'bg-blue-200' };
      case 'in-progress':
        return { text: 'กำลังดำเนินการ', class: 'text-yellow-800 font-medium bg-yellow-100', textColor: 'text-yellow-800', iconColor: 'text-yellow-600', iconBg: 'bg-yellow-200' };
      case 'completed':
        return { text: 'เสร็จสิ้น', class: 'text-green-800 font-medium bg-green-100', textColor: 'text-green-800', iconColor: 'text-green-600', iconBg: 'bg-green-200' };
      case 'rejected':
        return { text: 'ปฏิเสธแล้ว', class: 'text-red-800 font-medium bg-red-100', textColor: 'text-red-800', iconColor: 'text-red-600', iconBg: 'bg-red-200' };
      default:
        return { text: 'ไม่ระบุ', class: ' font-medium bg-gray-100', textColor: '', iconColor: '', iconBg: 'bg-gray-200' };
    }
  });

  salesStatusInfo = computed(() => {
    const reportStatus = this.task.salesReportData?.status as ReportStatus | undefined;
    if (!reportStatus) {
      return { text: '-', class: 'bg-gray-100 ' };
    }
    switch (reportStatus) {
      case 'Success':
        return { text: 'ปิดการขายสำเร็จ', class: 'bg-green-100 text-green-800' };
      case 'Pending':
        return { text: 'ระหว่างตัดสินใจ', class: 'bg-yellow-100 text-yellow-800' };
      case 'Failed':
        return { text: 'ไม่สำเร็จ', class: 'bg-red-100 text-red-800' };
      default:
        return { text: '-', class: 'bg-gray-100 ' };
    }
  });

  // Legacy controlName mapping (kept for backward compatibility)
  private readonly legacyInterestedProductsList = [
    { controlName: 'livingRoom', label: 'โซฟาและห้องนั่งเล่น' },
    { controlName: 'bedroom', label: 'ชุดห้องนอน' },
    { controlName: 'dining', label: 'โต๊ะอาหาร' },
    { controlName: 'kitchen', label: 'ชุดครัว' },
    { controlName: 'office', label: 'เฟอร์นิเจอร์สำนักงาน' },
    { controlName: 'outdoor', label: 'เฟอร์นิเจอร์นอกบ้าน' },
    { controlName: 'lighting', label: 'โคมไฟและของตกแต่ง' },
    { controlName: 'storage', label: 'ตู้และชั้นวางของ' },
    { controlName: 'kids', label: 'เฟอร์นิเจอร์เด็ก' }
  ];

  // Legacy controlName mapping (kept for backward compatibility)
  private readonly legacyAllReasons = [
    { controlName: 'wantsToDecide', label: 'ขอไปตัดสินใจก่อน' },
    { controlName: 'waitingForPromo', label: 'รอโปรโมชั่น' },
    { controlName: 'comparing', label: 'เปรียบเทียบกับที่อื่น' },
    { controlName: 'consultingFamily', label: 'ปรึกษาครอบครัว/เพื่อน' },
    { controlName: 'needsMoreInfo', label: 'ต้องการข้อมูลเพิ่มเติม' },
    { controlName: 'waitingForStock', label: 'รอสินค้าเข้า' },
    { controlName: 'financialApproval', label: 'รออนุมัติทางการเงิน' },
    { controlName: 'undecidedOnSpec', label: 'ยังไม่แน่ใจเรื่องสี/ขนาด' },
    { controlName: 'seasonalTiming', label: 'รอฤกษ์/ช่วงเวลาที่เหมาะสม' },
    { controlName: 'wantsToSeeSample', label: 'ต้องการดูสินค้าตัวอย่าง' },
    { controlName: 'priceTooHigh', label: 'ราคาสูงไป' },
    { controlName: 'productMismatch', label: 'สินค้าไม่ตรงความต้องการ' },
    { controlName: 'badService', label: 'ไม่พอใจบริการ' },
    { controlName: 'foundCheaper', label: 'เจอที่อื่นถูกกว่า' },
    { controlName: 'longDelivery', label: 'ระยะเวลาจัดส่งนานไป' },
    { controlName: 'outOfStock', label: 'สินค้าหมด/เลิกผลิต' },
    { controlName: 'negativeReview', label: 'เห็นรีวิวไม่ดี' },
    { controlName: 'competitorOffer', label: 'ข้อเสนอของคู่แข่งดีกว่า' },
    { controlName: 'changedMind', label: 'เปลี่ยนใจ/ไม่ต้องการแล้ว' },
    { controlName: 'budgetCut', label: 'งบประมาณไม่พอ' }
  ];

  customerDisplay = computed(() => {
    const report = this.task.salesReportData ?? null;
    const name = (report?.customerName ?? this.task.customerName ?? '').toString().trim();
    const phone = (report?.contactInfo ?? report?.customerContact ?? '').toString().trim();
    return {
      name: name || '-',
      phone: phone || '-'
    };
  });

  salesReportInterestedProducts = computed(() => {
    const report = this.task.salesReportData ?? null;
    if (!report) return [];

    // New format: productCategory as comma-separated string
    const productCategory = (report.productCategory ?? '').toString().trim();
    if (productCategory) {
      return productCategory
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
    }

    // Legacy format: interestedProducts object with controlName -> boolean
    const legacy = report.interestedProducts;
    if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
      return this.legacyInterestedProductsList
        .filter(p => (legacy as any)[p.controlName])
        .map(p => p.label);
    }

    // Fallback: array
    if (Array.isArray(legacy)) {
      return legacy.map((p: any) => String(p)).filter((p: string) => p.trim().length > 0);
    }

    return [];
  });

  salesReportReasons = computed(() => {
    const report = this.task.salesReportData ?? null;
    if (!report) return [];

    // New format: reasons as string[]
    if (Array.isArray(report.reasons)) {
      return report.reasons.map((r: any) => String(r)).filter((r: string) => r.trim().length > 0);
    }

    // Legacy format: reasons object with controlName -> boolean
    const legacy = report.reasons;
    if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
      return this.legacyAllReasons
        .filter(r => (legacy as any)[r.controlName])
        .map(r => r.label);
    }

    return [];
  });

  salesReportDescription = computed(() => {
    const report = this.task.salesReportData ?? null;
    const text = (report?.description ?? report?.additionalInfo ?? '').toString().trim();
    return text;
  });

  reasonsTitle = computed(() => {
    const reportStatus = this.task.salesReportData?.status as ReportStatus | undefined;
    if (reportStatus === 'Pending') return 'เหตุผลระหว่างตัดสินใจ';
    if (reportStatus === 'Failed') return 'เหตุผลปิดการขายไม่สำเร็จ';
    return 'เหตุผล';
  });

  setActiveTab(tab: 'details' | 'history') {
    if (tab === 'details' && !this.canShowDetails()) {
      this.activeTab.set('history');
      return;
    }
    this.activeTab.set(tab);
  }

  historyEntries = computed(() => {
    const entries: HistoryEntry[] = [];

    const pushEntry = (entry: HistoryEntry) => {
      if (entry.timestamp) {
        entries.push(entry);
      }
    };

    pushEntry({
      key: 'created',
      title: 'สร้างงานในระบบ',
      timestamp: this.task.createdAt,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      iconPath: 'M12 4v16m8-8H4'
    });

    if (this.task.startedAt) {
      pushEntry({
        key: 'started',
        title: 'พนักงานเริ่มดำเนินการ',
        timestamp: this.task.startedAt,
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      });
    }

    if (this.task.completedAt) {
      const isRejected = this.task.status === 'rejected';
      pushEntry({
        key: isRejected ? 'rejected' : 'completed',
        title: isRejected ? 'ปฏิเสธงาน' : 'ปิดงานเรียบร้อย',
        timestamp: this.task.completedAt,
        description: isRejected && this.task.rejectionReason ? `เหตุผล: ${this.task.rejectionReason}` : undefined,
        iconColor: isRejected ? 'text-red-600' : 'text-green-600',
        iconBg: isRejected ? 'bg-red-100' : 'bg-green-100',
        iconPath: isRejected
          ? 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
          : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      });
    }

    entries.sort((a, b) => {
      const dateA = new Date(a.timestamp!).getTime();
      const dateB = new Date(b.timestamp!).getTime();
      return dateB - dateA;
    });

    return entries;
  });

  formatThaiDateTime(dateString?: string | null): string {
    if (!dateString) {
      return '-';
    }
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        return dateString; // Return original if invalid
      }
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
      
      // Replace colon with dot in time (21:38 -> 21.38)
      const timeWithDot = thaiTime.replace(':', '.');
      
      return `${thaiDate} (${timeWithDot} น.)`;
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  }
}
