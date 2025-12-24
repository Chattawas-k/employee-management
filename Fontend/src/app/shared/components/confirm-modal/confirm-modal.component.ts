import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, IconComponent],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'ยืนยันการดำเนินการ';
  @Input() message: string = 'คุณแน่ใจหรือไม่ว่าต้องการดำเนินการนี้?';
  @Input() confirmText: string = 'ยืนยัน';
  @Input() cancelText: string = 'ยกเลิก';
  @Input() variant: 'danger' | 'warning' = 'danger';
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  handleConfirm(): void {
    this.onConfirm.emit();
  }

  handleCancel(): void {
    this.onCancel.emit();
  }
}

