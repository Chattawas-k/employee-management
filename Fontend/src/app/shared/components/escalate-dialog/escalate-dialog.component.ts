import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-escalate-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './escalate-dialog.component.html',
  styleUrls: ['./escalate-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EscalateDialogComponent {
  @Input() jobId: string = '';
  @Input() jobNumber: string = '';
  @Output() confirm = new EventEmitter<{ jobId: string; reason?: string }>();
  @Output() close = new EventEmitter<void>();

  escalateForm!: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder) {
    this.escalateForm = this.fb.group({
      reason: ['']
    });
  }

  onConfirm(): void {
    this.confirm.emit({
      jobId: this.jobId,
      reason: this.escalateForm.value.reason || undefined
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
