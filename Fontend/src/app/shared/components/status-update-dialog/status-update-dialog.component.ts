import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityStatusKey, getAvailabilityStatusDotClass, getAvailabilityStatusLabel } from '../../utils/availability-status.util';

export interface StatusUpdateOption {
  value: AvailabilityStatusKey;
  label: string;
  dotClass: string;
  description?: string;
}

@Component({
  selector: 'app-status-update-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-update-dialog.component.html',
  styleUrls: ['./status-update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusUpdateDialogComponent {
  @Input({ required: true }) currentStatus!: AvailabilityStatusKey;
  @Input() isSubmitting: boolean = false;

  @Output() confirm = new EventEmitter<AvailabilityStatusKey>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  selected = signal<AvailabilityStatusKey>('available');

  isBusy = computed(() => this.currentStatus === 'busy');

  options = computed<StatusUpdateOption[]>(() => {
    // Only manual statuses + available (back to ready)
    const base: AvailabilityStatusKey[] = ['available', 'lunchBreak', 'unavailable', 'leave', 'offsiteCustomer'];
    return base.map(value => ({
      value,
      label: value === 'available' ? 'กลับเป็นพร้อมรับงาน' : getAvailabilityStatusLabel(value),
      dotClass: getAvailabilityStatusDotClass(value),
      description: value === 'available'
        ? 'กลับเข้าคิวเพื่อรับงานใหม่'
        : 'สถานะนี้จะทำให้คุณไม่ถูกเลือกเข้ารับงานใหม่'
    }));
  });

  ngOnInit(): void {
    // Default selected is current, otherwise available
    this.selected.set(this.currentStatus ?? 'available');
  }

  onBackdropClick(): void {
    if (this.isSubmitting) return;
    this.close.emit();
  }

  onCancel(): void {
    if (this.isSubmitting) return;
    this.cancel.emit();
  }

  onConfirm(): void {
    if (this.isSubmitting || this.isBusy()) return;
    this.confirm.emit(this.selected());
  }
}

