import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StaffMember {
  name: string;
  role: string;
  avatarUrl: string;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobAssignmentCardComponent {
  staff = input.required<StaffMember>();
  action = output<StaffMember>();

  onActionClick() {
    // FIX: Isolate signal read from the emit call to simplify the expression.
    const staffMember = this.staff();
    this.action.emit(staffMember);
  }
}
