import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../task-column/task-column.component';

export type ReportStatus = 'Success' | 'Pending' | 'Failed';

export interface TaskAction {
  task: Task;
  actionType: 'start' | 'complete' | 'reject';
}

@Component({
  selector: 'app-task-card',
  standalone: true,
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Output() action = new EventEmitter<TaskAction>();
  @Output() detailClick = new EventEmitter<Task>();

  displayTime = computed(() => {
    switch (this.task.status) {
      case 'in-progress':
        return { label: 'เริ่มเมื่อ', time: this.formatThaiDateTime(this.task.startedAt) };
      case 'completed':
      case 'rejected':
        return { label: 'เสร็จเมื่อ', time: this.formatThaiDateTime(this.task.completedAt) };
      case 'pending':
      default:
        return { label: 'สร้างเมื่อ', time: this.formatThaiDateTime(this.task.createdAt) };
    }
  });

  formatThaiDateTime(dateString?: string | null): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return '';
      }
      
      const day = date.getDate();
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear() + 543; // Convert to Buddhist era
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day} ${month} ${year} (${hours}.${minutes} น.)`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '';
    }
  }

  salesStatusInfo = computed(() => {
    if (this.task.status !== 'completed' || !this.task.salesReportData?.status) {
      return null;
    }

    const status = this.task.salesReportData.status as ReportStatus;
    switch (status) {
      case 'Success':
        return { text: 'สำเร็จ', class: 'border-green-300 bg-green-100 text-green-800' };
      case 'Pending':
        return { text: 'รอตัดสินใจ', class: 'border-yellow-300 bg-yellow-100 text-yellow-800' };
      case 'Failed':
        return { text: 'ไม่สำเร็จ', class: 'border-red-300 bg-red-100 text-red-800' };
      default:
        return null;
    }
  });
}

