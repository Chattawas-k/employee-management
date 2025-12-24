import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss']
})
export class BadgeComponent {
  @Input() status: string = '';

  getBadgeClasses(): string {
    const base = 'px-2.5 py-1 rounded-full text-xs font-semibold';
    switch (this.status) {
      case 'Done':
        return `${base} bg-green-100 text-green-700`;
      case 'In Progress':
        return `${base} bg-blue-100 text-blue-700`;
      case 'Pending':
        return `${base} bg-yellow-100 text-yellow-700`;
      case 'Rejected':
        return `${base} bg-red-100 text-red-700`;
      case 'Active':
        return `${base} bg-green-100 text-green-700`;
      case 'Inactive':
        return `${base} bg-slate-100 text-slate-700`;
      case 'Busy':
        return `${base} bg-orange-100 text-orange-700`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  }

  getStatusText(): string {
    switch (this.status) {
      case 'Done': return 'เสร็จสิ้น';
      case 'In Progress': return 'กำลังดำเนินการ';
      case 'Pending': return 'รอดำเนินการ';
      case 'Rejected': return 'ปฏิเสธ';
      case 'Active': return 'ใช้งาน';
      case 'Inactive': return 'ระงับ';
      case 'Busy': return 'ไม่ว่าง';
      default: return this.status;
    }
  }
}

