import { ChangeDetectionStrategy, Component, signal, output, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SalesJobStatus = 'pending' | 'sold' | 'lost';
export type SalesJobSubStatus = 'รอเสนอราคา' | 'ต่อรอง' | 'รอตัดสินใจ' | 'ชนะ' | 'แพ้คู่แข่ง' | 'ยกเลิก';

export interface SalesJob {
  id: string;
  customer: {
    name: string;
  };
  productService: string;
  value: number;
  status: SalesJobStatus;
  subStatus: SalesJobSubStatus;
  subStatusClass: string;
  lastUpdated: Date;
  nextAppointment?: Date;
  saleDate?: Date;
}

const today = new Date();
const yesterday = new Date(new Date().setDate(today.getDate() - 1));
const twoHoursAgo = new Date(today.getTime() - 2 * 60 * 60 * 1000);
const threeDaysAgo = new Date(new Date().setDate(today.getDate() - 3));
const lastWeek = new Date(new Date().setDate(today.getDate() - 7));

// Mocking times from the screenshot
const seventeenMinutesAgo = new Date(today.getTime() - 17 * 60 * 1000);
const elevenMinutesAgo = new Date(today.getTime() - 11 * 60 * 1000);

// Mocking dates from the screenshot
const date2025_Dec_14 = new Date('2025-12-14T10:00:00');
const date2025_Dec_20 = new Date('2025-12-20T10:00:00');
const date2025_Dec_11 = new Date('2025-12-11T10:00:00');


@Component({
  selector: 'app-my-sales-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './my-sales-jobs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MySalesJobsComponent {
  menuClick = output<void>();

  allJobs = signal<SalesJob[]>([
    { id: 'SJ-001', customer: { name: 'บริษัท โฮม เดคคอร์ จำกัด' }, productService: 'ชุดครัวบิ้วท์อิน Modern Loft', value: 250000, status: 'pending', subStatus: 'รอตัดสินใจ', subStatusClass: 'bg-yellow-100 text-yellow-800', lastUpdated: seventeenMinutesAgo, nextAppointment: date2025_Dec_14 },
    { id: 'SJ-002', customer: { name: 'คุณวิภาวรรณ' }, productService: 'โซฟา L-Shape รุ่นใหญ่', value: 45000, status: 'sold', subStatus: 'ชนะ', subStatusClass: 'bg-green-100 text-green-800', lastUpdated: twoHoursAgo, nextAppointment: undefined, saleDate: new Date('2025-12-12T14:30:00') },
    { id: 'SJ-003', customer: { name: 'โครงการ The Grand Condo' }, productService: 'เฟอร์นิเจอร์สำนักงาน 20 ชุด', value: 320000, status: 'lost', subStatus: 'แพ้คู่แข่ง', subStatusClass: 'bg-red-100 text-red-800', lastUpdated: yesterday, nextAppointment: undefined },
    { id: 'SJ-004', customer: { name: 'คุณสมศักดิ์' }, productService: 'ชุดห้องนอน King Size', value: 89000, status: 'pending', subStatus: 'ต่อรอง', subStatusClass: 'bg-blue-100 text-blue-800', lastUpdated: threeDaysAgo, nextAppointment: date2025_Dec_20 },
    { id: 'SJ-005', customer: { name: 'คุณมาลี' }, productService: 'ผ้าม่านกัน UV', value: 15000, status: 'lost', subStatus: 'ยกเลิก', subStatusClass: 'bg-gray-100 text-gray-800', lastUpdated: lastWeek },
    { id: 'SJ-006', customer: { name: 'ร้านกาแฟ The Roaster' }, productService: 'ชุดโต๊ะ-เก้าอี้ 10 ชุด', value: 75000, status: 'sold', subStatus: 'ชนะ', subStatusClass: 'bg-green-100 text-green-800', lastUpdated: yesterday, saleDate: new Date('2025-12-10T18:00:00') },
    { id: 'SJ-007', customer: { name: 'คุณเกริกพล' }, productService: 'ตู้เสื้อผ้า Walk-in closet', value: 120000, status: 'pending', subStatus: 'รอเสนอราคา', subStatusClass: 'bg-indigo-100 text-indigo-800', lastUpdated: elevenMinutesAgo, nextAppointment: date2025_Dec_11 },
  ]);

  searchTerm = signal('');
  activeTab = signal<SalesJobStatus>('pending');
  
  filteredJobs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const tab = this.activeTab();
    
    return this.allJobs()
      .filter(job => job.status === tab)
      .filter(job => 
        term === '' ||
        job.customer.name.toLowerCase().includes(term) ||
        job.id.toLowerCase().includes(term) ||
        job.productService.toLowerCase().includes(term)
      );
  });
  
  counts = computed(() => {
    return this.allJobs().reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<SalesJobStatus, number>);
  });

  setTab(tab: SalesJobStatus) {
    this.activeTab.set(tab);
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `เมื่อสักครู่`;
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${days} วันที่แล้ว`;
  }
  
  isAppointmentInFuture(date?: Date): boolean {
    if (!date) return false;
    const mockToday = new Date('2025-12-13T10:00:00');
    return date > mockToday;
  }

  isAppointmentUrgent(date?: Date): boolean {
    if (!date) return false;
    const mockToday = new Date('2025-12-13T10:00:00');
    const diffTime = date.getTime() - mockToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 2;
  }

  isAppointmentOverdue(date?: Date): boolean {
    if (!date) return false;
    const mockToday = new Date('2025-12-13T10:00:00');
    return date < mockToday;
  }
  
  formatThaiDate(date?: Date): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }

  formatThaiDateShort(date?: Date): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(new Date(date));
  }
}