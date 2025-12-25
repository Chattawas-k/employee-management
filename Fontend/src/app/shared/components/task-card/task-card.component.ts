import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../task-column/task-column.component';

type ReportStatus = 'Success' | 'Failed' | 'Pending';

@Component({
  selector: 'app-task-card',
  standalone: true,
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class TaskCardComponent {
  task = input.required<Task>();
  action = output<Task>();
  detailClick = output<Task>();

  displayTime = computed(() => {
    const task = this.task();
    switch (task.status) {
      case 'in-progress':
        return { label: 'เริ่มเมื่อ', time: task.startedAt };
      case 'completed':
      case 'rejected':
        return { label: 'เสร็จเมื่อ', time: task.completedAt };
      case 'pending':
      default:
        return { label: 'สร้างเมื่อ', time: task.createdAt };
    }
  });

  salesStatusInfo = computed(() => {
    const task = this.task();
    if (task.status !== 'completed' || !task.salesReportData?.status) {
      return null;
    }

    const status = task.salesReportData.status as ReportStatus;
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

