import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../task-column/task-column.component';

export type ReportStatus = 'Success' | 'Pending' | 'Failed';

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
  @Output() action = new EventEmitter<Task>();
  @Output() detailClick = new EventEmitter<Task>();

  displayTime = computed(() => {
    switch (this.task.status) {
      case 'in-progress':
        return { label: 'เริ่มเมื่อ', time: this.task.startedAt };
      case 'completed':
      case 'rejected':
        return { label: 'เสร็จเมื่อ', time: this.task.completedAt };
      case 'pending':
      default:
        return { label: 'สร้างเมื่อ', time: this.task.createdAt };
    }
  });

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

