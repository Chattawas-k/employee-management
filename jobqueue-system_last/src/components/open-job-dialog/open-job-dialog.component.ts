import { ChangeDetectionStrategy, Component, output, input, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../task-column/task-column.component';

@Component({
  selector: 'app-open-job-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './open-job-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenJobDialogComponent implements OnInit {
  userName = input<string>('');
  task = input<Task | null>(null);
  confirm = output<any>();
  close = output<void>();

  isEditMode = computed(() => !!this.task());

  private fb = new FormBuilder();

  jobForm = this.fb.group({
    jobTitle: ['Walk-in Customer', Validators.required],
    customerName: ['ลูกค้าทั่วไป', Validators.required],
    details: ['บริการลูกค้าหน้าร้าน'],
    priority: ['Normal', Validators.required]
  });

  ngOnInit(): void {
    const currentTask = this.task();
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
      this.confirm.emit(this.jobForm.value);
    }
  }
}