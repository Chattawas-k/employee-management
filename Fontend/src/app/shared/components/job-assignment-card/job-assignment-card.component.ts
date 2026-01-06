import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StaffMember {
  id?: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: 'พร้อมรับงาน' | 'ติดลูกค้า' | 'พัก/ลางาน';
  statusClass: string;
  currentTasks: number;
  queuePosition: number;
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

  getAvatarUrl(): string {
    if (this.staff.avatarUrl) {
      return this.staff.avatarUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.staff.name)}&background=6366f1&color=fff`;
  }
}

