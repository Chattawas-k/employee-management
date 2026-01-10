import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffDetail } from '../../../models/manager.model';
import { ChartCardComponent } from '../../../features/manager-dashboard/components/chart-card/chart-card.component';

@Component({
  selector: 'app-staff-detail-drawer',
  standalone: true,
  imports: [CommonModule, ChartCardComponent],
  templateUrl: './staff-detail-drawer.component.html',
  styleUrls: ['./staff-detail-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffDetailDrawerComponent {
  @Input() staff: StaffDetail | null = null;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }

  getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('th-TH');
  }

  formatTimeSpan(span: string): string {
    // Parse ISO duration or simple format
    const minutes = this.parseTimeToMinutes(span);
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
