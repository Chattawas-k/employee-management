import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../task-column/task-column.component';
import { ReportStatus } from '../../../models/sales-report.model';

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail-dialog.component.html',
  styleUrls: ['./task-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskDetailDialogComponent {
  @Input() task!: Task;
  @Output() close = new EventEmitter<void>();

  activeTab = signal<'details' | 'history'>('details');

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
        return { text: 'ไม่ระบุ', class: 'text-gray-800 font-medium bg-gray-100', textColor: 'text-gray-800', iconColor: 'text-gray-600', iconBg: 'bg-gray-200' };
    }
  });

  salesStatusInfo = computed(() => {
    const reportStatus = this.task.salesReportData?.status as ReportStatus | undefined;
    if (!reportStatus) {
      return { text: '-', class: 'bg-gray-100 text-gray-800' };
    }
    switch (reportStatus) {
      case 'Success':
        return { text: 'ปิดการขายสำเร็จ', class: 'bg-green-100 text-green-800' };
      case 'Pending':
        return { text: 'ระหว่างตัดสินใจ', class: 'bg-yellow-100 text-yellow-800' };
      case 'Failed':
        return { text: 'ไม่สำเร็จ', class: 'bg-red-100 text-red-800' };
      default:
        return { text: '-', class: 'bg-gray-100 text-gray-800' };
    }
  });

  private readonly interestedProductsList = [
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

  private readonly allReasons = [
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

  salesReportInterestedProducts = computed(() => {
    const reportData = this.task.salesReportData;
    if (!reportData || !reportData.interestedProducts) return [];
    
    return this.interestedProductsList
      .filter(p => reportData.interestedProducts[p.controlName])
      .map(p => p.label);
  });

  salesReportReasons = computed(() => {
    const reportData = this.task.salesReportData;
    if (!reportData || !reportData.reasons) return [];

    return this.allReasons
      .filter(r => reportData.reasons[r.controlName])
      .map(r => r.label);
  });

  setActiveTab(tab: 'details' | 'history') {
    this.activeTab.set(tab);
  }
}
