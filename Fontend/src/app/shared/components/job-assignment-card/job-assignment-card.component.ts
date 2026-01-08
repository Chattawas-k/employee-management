import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StaffMember {
  name: string;
  role: string;
  avatarUrl: string;
  status: 'พร้อมรับงาน' | 'ติดลูกค้า' | 'พัก' | 'ไม่พร้อมรับงาน' | 'ไม่ได้ทำงาน';
  statusClass: string;
  currentTasks: number; // งานที่ทำอยู่ (In-Progress)
  pendingTasks: number; // งานที่ต้องทำ (Pending)
  totalTasks: number; // งานทั้งหมด
  queuePosition: number;
  employeeId?: string;
  queueStatus?: 'Active' | 'Busy' | 'Inactive';
}

@Component({
  selector: 'app-job-assignment-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-assignment-card.component.html',
  styleUrls: ['./job-assignment-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobAssignmentCardComponent {
  @Input() staff!: StaffMember;
  @Output() action = new EventEmitter<StaffMember>();

  onActionClick() {
    this.action.emit(this.staff);
  }
}

