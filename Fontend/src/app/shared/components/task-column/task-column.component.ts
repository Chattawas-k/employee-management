import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskSalesReportData } from '../../../models/task.model';

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
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  rejectionReason?: string;
  salesReportData?: TaskSalesReportData | null;
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
  @Input() title: string = '';
  @Input() count: number = 0;
  @Input() tasks: Task[] = [];
  @Input() isCollapsible: boolean = false;
  @Output() taskAction = new EventEmitter<Task>();
  @Output() taskDetailClick = new EventEmitter<Task>();

  isCollapsed = signal(false);

  ngOnInit(): void {
    if (this.isCollapsible) {
      this.isCollapsed.set(true);
    }
  }

  toggleCollapse() {
    if (this.isCollapsible) {
      this.isCollapsed.update(v => !v);
    }
  }
}
