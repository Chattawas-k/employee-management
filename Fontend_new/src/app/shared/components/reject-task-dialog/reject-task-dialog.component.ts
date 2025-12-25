import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../task-column/task-column.component';

@Component({
  selector: 'app-reject-task-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reject-task-dialog.component.html',
  styleUrls: ['./reject-task-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RejectTaskDialogComponent {
  @Input() task!: Task;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ reason: string }>();
  
  private fb = new FormBuilder();

  rejectForm = this.fb.group({
    reason: ['', Validators.required],
  });

  onConfirm() {
    if (this.rejectForm.valid) {
      this.confirm.emit(this.rejectForm.value as { reason: string });
    }
  }
}
