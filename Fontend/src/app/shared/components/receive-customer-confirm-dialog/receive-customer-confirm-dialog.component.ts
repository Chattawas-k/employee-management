import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receive-customer-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receive-customer-confirm-dialog.component.html',
  styleUrls: ['./receive-customer-confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiveCustomerConfirmDialogComponent {
  @Input() isSubmitting: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onBackdropClick(): void {
    if (this.isSubmitting) return;
    this.close.emit();
  }

  onCancel(): void {
    if (this.isSubmitting) return;
    this.cancel.emit();
  }

  onConfirm(): void {
    if (this.isSubmitting) return;
    this.confirm.emit();
  }
}

