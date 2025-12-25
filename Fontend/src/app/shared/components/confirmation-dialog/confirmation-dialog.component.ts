import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../task-column/task-column.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  @Input() task!: Task;
  @Output() confirm = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}

