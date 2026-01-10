import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-cancel-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cancel-dialog.component.html',
  styleUrls: ['./cancel-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CancelDialogComponent {
  @Input() jobId: string = '';
  @Input() jobNumber: string = '';
  @Output() confirm = new EventEmitter<{ jobId: string; reason: string }>();
  @Output() close = new EventEmitter<void>();

  cancelForm!: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder) {
    this.cancelForm = this.fb.group({
      reason: ['', Validators.required]
    });
  }

  onConfirm(): void {
    if (this.cancelForm.valid) {
      this.confirm.emit({
        jobId: this.jobId,
        reason: this.cancelForm.value.reason
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
