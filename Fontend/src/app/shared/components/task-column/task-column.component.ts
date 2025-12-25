import { ChangeDetectionStrategy, Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCardComponent } from '../task-card/task-card.component';

export interface Task {
  id: string;
  createdAt: string;
  priority: string;
  priorityClass: string;
  buttonText: string;
  buttonIcon: 'refresh' | 'check' | 'cross';
  buttonClass: string;
  startedAt?: string | null;
  completedAt?: string | null;
  jobTitle?: string;
  customerName?: string;
  details?: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  rejectionReason?: string;
  salesReportData?: any;
}

@Component({
  selector: 'app-task-column',
  standalone: true,
  templateUrl: './task-column.component.html',
  styleUrls: ['./task-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TaskCardComponent]
})
export class TaskColumnComponent implements OnInit {
  title = input.required<string>();
  count = input.required<number>();
  tasks = input.required<Task[]>();
  isCollapsible = input(false);
  taskAction = output<Task>();
  taskDetailClick = output<Task>();

  isCollapsed = signal(false);

  ngOnInit(): void {
    if (this.isCollapsible()) {
      this.isCollapsed.set(true);
    }
  }

  toggleCollapse() {
    if (this.isCollapsible()) {
      this.isCollapsed.update(v => !v);
    }
  }
}

