import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QueueSnapshotTicket } from '../../../../models/manager.model';

@Component({
  selector: 'app-queue-snapshot-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './queue-snapshot-panel.component.html',
  styleUrls: ['./queue-snapshot-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueueSnapshotPanelComponent {
  @Input() tickets: QueueSnapshotTicket[] = [];
  @Input() isLoading: boolean = false;
  @Output() ticketClick = new EventEmitter<QueueSnapshotTicket>();

  onTicketClick(ticket: QueueSnapshotTicket): void {
    this.ticketClick.emit(ticket);
  }

  getPriorityColor(priority: string): string {
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'urgent' || priorityLower === 'ด่วน') {
      return 'bg-red-100 text-red-700 border-red-200';
    } else if (priorityLower === 'high' || priorityLower === 'สูง') {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  getChannelBadgeColor(channel: string): string {
    const channelLower = channel.toLowerCase();
    if (channelLower === 'phone' || channelLower === 'โทรศัพท์') {
      return 'bg-blue-100 text-blue-700';
    } else if (channelLower === 'chat' || channelLower === 'แชท') {
      return 'bg-green-100 text-green-700';
    } else if (channelLower === 'walk-in' || channelLower === 'หน้าร้าน') {
      return 'bg-purple-100 text-purple-700';
    } else if (channelLower === 'email' || channelLower === 'อีเมล') {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-gray-100 text-gray-700';
  }

  getWaitTimeColor(waitTime: string): string {
    // Parse wait time (format: "PT30M" or "1h 30m")
    const minutes = this.parseWaitTimeToMinutes(waitTime);
    if (minutes >= 30) {
      return 'text-red-600 font-semibold';
    } else if (minutes >= 15) {
      return 'text-orange-600 font-medium';
    }
    return 'text-gray-600';
  }

  formatWaitTime(waitTime: string): string {
    const minutes = this.parseWaitTimeToMinutes(waitTime);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}ชม. ${mins}นาที`;
    }
    return `${minutes}นาที`;
  }

  private parseWaitTimeToMinutes(waitTime: string): number {
    // Handle ISO duration format (PT30M, PT1H30M) or simple format
    if (waitTime.startsWith('PT')) {
      const hoursMatch = waitTime.match(/(\d+)H/);
      const minutesMatch = waitTime.match(/(\d+)M/);
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      return hours * 60 + minutes;
    }
    // Handle "1h 30m" format
    const hoursMatch = waitTime.match(/(\d+)h/);
    const minutesMatch = waitTime.match(/(\d+)m/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return hours * 60 + minutes;
  }
}
