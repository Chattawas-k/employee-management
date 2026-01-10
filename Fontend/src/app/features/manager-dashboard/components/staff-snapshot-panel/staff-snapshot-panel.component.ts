import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StaffSnapshot } from '../../../../models/manager.model';

@Component({
  selector: 'app-staff-snapshot-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-snapshot-panel.component.html',
  styleUrls: ['./staff-snapshot-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffSnapshotPanelComponent {
  @Input() staff: StaffSnapshot[] = [];
  @Input() isLoading: boolean = false;
  @Output() staffClick = new EventEmitter<StaffSnapshot>();

  onStaffClick(staffMember: StaffSnapshot): void {
    this.staffClick.emit(staffMember);
  }

  getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'available' || statusLower === 'พร้อม') {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (statusLower === 'busy' || statusLower === 'ยุ่ง') {
      return 'bg-red-100 text-red-700 border-red-200';
    } else if (statusLower === 'break' || statusLower === 'พัก') {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    } else if (statusLower === 'unavailable' || statusLower === 'ไม่ว่าง') {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  formatTimeInStatus(timeInStatus: string): string {
    // Parse ISO duration or simple format
    const minutes = this.parseTimeToMinutes(timeInStatus);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}ชม. ${mins}นาที`;
    }
    return `${minutes}นาที`;
  }

  private parseTimeToMinutes(timeStr: string): number {
    if (timeStr.startsWith('PT')) {
      const hoursMatch = timeStr.match(/(\d+)H/);
      const minutesMatch = timeStr.match(/(\d+)M/);
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      return hours * 60 + minutes;
    }
    const hoursMatch = timeStr.match(/(\d+)h/);
    const minutesMatch = timeStr.match(/(\d+)m/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return hours * 60 + minutes;
  }
}
