import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

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
  imports: [CommonModule, AvatarComponent, BadgeComponent, ButtonComponent, IconComponent],
  templateUrl: './job-assignment-card.component.html',
  styleUrls: ['./job-assignment-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobAssignmentCardComponent {
  staff = input.required<StaffMember>();
  action = output<StaffMember>();

  onActionClick() {
    const staffMember = this.staff();
    this.action.emit(staffMember);
  }
}

