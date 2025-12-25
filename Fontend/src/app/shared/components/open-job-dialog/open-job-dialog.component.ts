import { Component, Input, Output, EventEmitter, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../task-column/task-column.component';
import { PartialJobFormData } from '../../../models/task.model';

@Component({
  selector: 'app-open-job-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './open-job-dialog.component.html',
  styleUrls: ['./open-job-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenJobDialogComponent implements OnInit {
  @Input() userName: string = '';
  @Input() task: Task | null = null;
  @Output() confirm = new EventEmitter<PartialJobFormData>();
  @Output() close = new EventEmitter<void>();

  isEditMode = computed(() => !!this.task);

  private fb = new FormBuilder();

  jobForm = this.fb.group({
    jobTitle: ['Walk-in Customer', Validators.required],
    customerName: ['ลูกค้าทั่วไป', Validators.required],
    details: ['บริการลูกค้าหน้าร้าน'],
    priority: ['Normal', Validators.required]
  });

  ngOnInit(): void {
    const currentTask = this.task;
    if (currentTask) {
      this.jobForm.patchValue({
        jobTitle: currentTask.jobTitle || 'Walk-in Customer',
        customerName: currentTask.customerName || 'ลูกค้าทั่วไป',
        details: currentTask.details || '',
        priority: currentTask.priority === 'ด่วน' ? 'Urgent' : 'Normal'
      });
    }
  }

  onConfirm() {
    if (this.jobForm.valid) {
      const formValue = this.jobForm.value;
      // Convert null values to undefined for type compatibility
      const jobData: PartialJobFormData = {
        jobTitle: formValue.jobTitle ?? undefined,
        customerName: formValue.customerName ?? undefined,
        details: formValue.details ?? undefined,
        priority: formValue.priority ?? undefined
      };
      this.confirm.emit(jobData);
    }
  }
}
