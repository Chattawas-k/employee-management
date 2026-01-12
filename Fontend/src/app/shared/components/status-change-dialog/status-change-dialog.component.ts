import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getAvailabilityStatusBadgeClass, getAvailabilityStatusLabel, normalizeAvailabilityStatus } from '../../utils/availability-status.util';

@Component({
  selector: 'app-status-change-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-change-dialog.component.html',
  styleUrls: ['./status-change-dialog.component.scss']
})
export class StatusChangeDialogComponent {
  @Input() currentStatus!: string;
  @Input() newStatus!: string;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  getStatusLabel(status: string): string {
    return getAvailabilityStatusLabel(normalizeAvailabilityStatus(status));
  }

  getStatusIconClasses(): string {
    const normalized = normalizeAvailabilityStatus(this.newStatus);
    const badge = getAvailabilityStatusBadgeClass(normalized);
    // badge is "bg-... text-... border-..." → use bg + text only for the icon
    const parts = badge.split(' ').filter(p => p.startsWith('bg-') || p.startsWith('text-'));
    return parts.join(' ');
  }

  getIconBgClass(): string {
    const normalized = normalizeAvailabilityStatus(this.newStatus);
    const badge = getAvailabilityStatusBadgeClass(normalized);
    return badge.split(' ').find(p => p.startsWith('bg-')) || 'bg-blue-100';
  }

  getIconTextClass(): string {
    const normalized = normalizeAvailabilityStatus(this.newStatus);
    const badge = getAvailabilityStatusBadgeClass(normalized);
    return badge.split(' ').find(p => p.startsWith('text-')) || 'text-blue-600';
  }
}

