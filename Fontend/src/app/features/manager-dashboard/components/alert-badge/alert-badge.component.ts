import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alert } from '../../../../models/manager.model';

@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-badge.component.html',
  styleUrls: ['./alert-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertBadgeComponent {
  @Input() alert!: Alert;
  @Output() alertClick = new EventEmitter<Alert>();
  @Output() dismiss = new EventEmitter<string>();

  onAlertClick(): void {
    this.alertClick.emit(this.alert);
  }

  onDismiss(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit(this.alert.id);
  }

  getSeverityColor(): string {
    switch (this.alert.severity) {
      case 'High':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'Medium':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'Low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  getSeverityIconColor(): string {
    switch (this.alert.severity) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-orange-600';
      case 'Low':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  getSeverityBadgeColor(): string {
    switch (this.alert.severity) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-orange-100 text-orange-700';
      case 'Low':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getAlertIcon(): string {
    switch (this.alert.type) {
      case 'WAITING_OVER_SLA':
      case 'ASSIGNED_OVER_SLA':
        return 'clock';
      case 'READY_STAFF_BELOW_THRESHOLD':
        return 'users';
      case 'WAITING_SPIKE':
        return 'trending-up';
      default:
        return 'alert-circle';
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} วันที่แล้ว`;
  }
}
