import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerTicket } from '../../../models/manager.model';

@Component({
  selector: 'app-ticket-detail-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-detail-drawer.component.html',
  styleUrls: ['./ticket-detail-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailDrawerComponent {
  @Input() ticket: ManagerTicket | null = null;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() forceAssign = new EventEmitter<{ jobId: string; staffId: string; reason?: string }>();
  @Output() transfer = new EventEmitter<{ jobId: string; toStaffId: string; reason: string }>();
  @Output() escalate = new EventEmitter<{ jobId: string; reason?: string }>();
  @Output() cancel = new EventEmitter<{ jobId: string; reason: string }>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('th-TH');
  }

  formatDuration(createdDate: string): string {
    const created = new Date(createdDate);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} นาที`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมง`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} วัน`;
  }

  getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (statusLower === 'assigned') return 'bg-blue-100 text-blue-700';
    if (statusLower === 'inprogress') return 'bg-purple-100 text-purple-700';
    if (statusLower === 'closedwon') return 'bg-green-100 text-green-700';
    if (statusLower === 'closedlost') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }

  getPriorityColor(priority: string): string {
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'urgent' || priorityLower === 'ด่วน') return 'bg-red-100 text-red-700';
    if (priorityLower === 'high' || priorityLower === 'สูง') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  }
}
